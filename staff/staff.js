(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const labels = {new:'Nouă',accepted:'Acceptată',preparing:'În preparare',ready:'Pregătită',out_for_delivery:'În livrare',completed:'Finalizată',cancelled:'Anulată'};
  const modes = {delivery:'Livrare',pickup:'Ridicare',dine_in:'În restaurant'};
  const nextStatus = {new:'accepted',accepted:'preparing',preparing:'ready',ready:'out_for_delivery',out_for_delivery:'completed'};
  const actionLabels = {accepted:'Acceptă comanda',preparing:'Începe prepararea',ready:'Marchează pregătită',out_for_delivery:'Trimite la livrare',completed:'Finalizează comanda'};
  let demo = false, orders = [], selected = null, offset = 0, total = 0, busy = false, loading = false, pendingLoad = false, revision = 0, searchTimer;
  let demoOrders = [];
  const money = value => `${new Intl.NumberFormat('ro-MD',{maximumFractionDigits:2}).format(Number(value))} lei`;
  const time = value => new Intl.DateTimeFormat('ro-MD',{timeZone:'Europe/Chisinau',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(value));
  const esc = text => String(text ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const badge = status => `<span class="badge ${esc(status)}">${esc(labels[status] || status)}</span>`;
  function showError(message) { $('error').hidden = !message; $('error').textContent = message; }
  function showLogin() {
    revision++; selected = null; orders = []; demoOrders = [];
    $('dashboard').hidden = true; $('login').hidden = false; $('logout').hidden = true;
    $('orderList').replaceChildren(); $('detail').replaceChildren(); $('password').value = '';
  }
  async function api(path,options={}) {
    const response = await fetch(`/api/staff/${path}`,{credentials:'same-origin',cache:'no-store',...options,headers:{'Content-Type':'application/json',...options.headers}});
    const data = await response.json().catch(()=>({code:'SERVICE_UNAVAILABLE'}));
    if(!response.ok) {
      if(response.status===401 || response.status===403) { showLogin(); $('loginMessage').textContent='Sesiunea a expirat sau accesul nu este permis. Intră din nou.'; }
      const error = new Error(data.code || 'SERVICE_UNAVAILABLE'); error.status=response.status; throw error;
    }
    return data;
  }
  function enter(staff) {
    $('login').hidden=true; $('dashboard').hidden=false; $('logout').hidden=demo; $('demoBanner').hidden=!demo;
    $('staffName').textContent=demo?'O privire asupra zilei tale. Date demonstrative.':`Bun venit, ${staff.display_name}.`;
    offset=0;selected=null;$('search').value='';$('statusFilter').value='active';showError('');renderEmpty();load();
  }
  function makeDemo() {
    const now=Date.now();
    return [
      {id:'demo-1',order_number:1042,status:'new',version:0,fulfillment:'delivery',customer_name:'Client demonstrativ A',customer_phone:'',delivery:{city:'Chișinău',street:'Adresă demonstrativă',apartment:'',access:''},notes:'Exemplu de instrucțiune pentru restaurant.',items:[{name:'Plov Special Tașkent',qty:2,price:150},{name:'Salată Tașkent',qty:1,price:85}],subtotal:385,notification_status:'not_configured',created_at:new Date(now-4*60000).toISOString()},
      {id:'demo-2',order_number:1041,status:'preparing',version:0,fulfillment:'pickup',customer_name:'Client demonstrativ B',customer_phone:'',delivery:null,notes:'',items:[{name:'Business Lunch',qty:1,price:170,selectedSummary:'Exemplu de selecție din meniu'}],subtotal:170,notification_status:'not_configured',created_at:new Date(now-19*60000).toISOString()},
      {id:'demo-3',order_number:1040,status:'out_for_delivery',version:0,fulfillment:'delivery',customer_name:'Client demonstrativ C',customer_phone:'',delivery:{city:'Chișinău',street:'Adresă demonstrativă'},notes:'',items:[{name:'Lagman',qty:2,price:120}],subtotal:240,notification_status:'not_configured',created_at:new Date(now-41*60000).toISOString()}
    ].map(order=>({...order,events:[{to_status:'new',created_at:order.created_at,note:'Comandă fictivă pentru demonstrație.'}]}));
  }
  async function load() {
    if(busy || $('dashboard').hidden) return;
    if(loading) { pendingLoad=true;return; }
    loading=true;const currentRevision=revision;
    $('refresh').disabled=true;$('syncState').textContent=demo?'Demonstrație':'Se actualizează…';
    try {
      let snapshot;
      if(demo) {
        const filter=$('statusFilter').value;const search=$('search').value.trim().toLowerCase();
        const matches=demoOrders.filter(order=>(filter==='all' || (filter==='active' && !['completed','cancelled'].includes(order.status)) || filter===order.status) && `${order.customer_name} ${order.customer_phone} TK-${order.order_number}`.toLowerCase().includes(search));
        snapshot={orders:matches.slice(offset,offset+50),total:matches.length,counts:{new:demoOrders.filter(o=>o.status==='new').length,active:demoOrders.filter(o=>!['completed','cancelled'].includes(o.status)).length,completed_today:demoOrders.filter(o=>o.status==='completed').length}};
      } else { snapshot=await api(`orders?status=${encodeURIComponent($('statusFilter').value)}&search=${encodeURIComponent($('search').value.trim())}&offset=${offset}`); }
      if(currentRevision!==revision) return;
      orders=snapshot.orders;total=snapshot.total;
      $('newCount').textContent=snapshot.counts.new;$('activeCount').textContent=snapshot.counts.active;$('doneCount').textContent=snapshot.counts.completed_today;
      renderList();
      const updated=orders.find(order=>order.id===selected?.id);
      if(updated && !document.activeElement?.closest('#cancelForm')) { selected=updated;renderDetail(); }
      else if(selected && !updated) {selected=null;renderEmpty();}
      $('syncState').textContent=demo?'Date fictive':`Actualizat ${new Intl.DateTimeFormat('ro-MD',{hour:'2-digit',minute:'2-digit'}).format(new Date())}`;
      showError('');
    } catch(error) { if(currentRevision===revision && !$('dashboard').hidden) {showError('Nu putem actualiza comenzile. Încearcă din nou. Datele afișate pot fi vechi.');$('syncState').textContent='Conexiune întreruptă';} }
    finally {loading=false;$('refresh').disabled=false;if(pendingLoad){pendingLoad=false;load();}}
  }
  function renderList() {
    $('orderList').innerHTML=orders.length?orders.map(order=>`<button class="order-row ${selected?.id===order.id?'selected':''}" data-order="${esc(order.id)}" aria-pressed="${selected?.id===order.id}"><span class="row-top"><strong>TK-${esc(order.order_number)}</strong>${badge(order.status)}</span><span class="customer">${esc(order.customer_name)}</span><span class="row-bottom"><span>${esc(modes[order.fulfillment])} · ${esc(time(order.created_at))}</span><strong>${esc(money(order.subtotal))}</strong></span></button>`).join(''):'<div class="empty"><h2>Totul este la zi.</h2><p>Nicio comandă pentru această selecție.</p></div>';
    $('pageInfo').textContent=total?`${offset+1}–${Math.min(offset+50,total)} din ${total}`:'0 comenzi';
    $('previous').disabled=offset===0;$('next').disabled=offset+50>=total;
  }
  function renderEmpty() { $('detail').innerHTML='<div class="empty"><span class="empty-mark" aria-hidden="true">T</span><h2>Fiecare comandă contează.</h2><p>Alege o comandă pentru a vedea detaliile.</p></div>'; }
  function renderDetail() {
    if(!selected) {renderEmpty();return;}
    const order=selected,terminal=['completed','cancelled'].includes(order.status);
    const next=order.status==='ready' && order.fulfillment!=='delivery'?'completed':nextStatus[order.status];
    const address=order.delivery?Object.values(order.delivery).filter(Boolean).join(', '):'';
    const validPhone=/^\+?\d{8,15}$/.test(order.customer_phone);
    $('detail').innerHTML=`<div class="detail-title"><h2>TK-${esc(order.order_number)}</h2>${badge(order.status)}</div><p class="meta">${esc(time(order.created_at))} · ${esc(modes[order.fulfillment])}</p><hr><h3>Client</h3><p>${esc(order.customer_name)}</p><p>${validPhone?`<a href="tel:${esc(order.customer_phone)}">${esc(order.customer_phone)}</a>`:'Telefon fictiv — demonstrație'}</p>${address?`<h3>Adresă de livrare</h3><p>${esc(address)}</p>`:''}${order.notes?`<h3>Instrucțiuni</h3><p>${esc(order.notes)}</p>`:''}<h3>Preparate</h3>${order.items.map(item=>`<div class="item"><div>${esc(item.qty)} × ${esc(item.name)}${item.selectedSummary?`<small>${esc(item.selectedSummary)}</small>`:''}</div><strong>${esc(money(item.qty*item.price))}</strong></div>`).join('')}<div class="total"><span>Subtotal preparate</span><strong>${esc(money(order.subtotal))}</strong></div>${order.fulfillment==='delivery'?'<p class="fee-note">Costul livrării nu este inclus. Confirmați telefonic suma și disponibilitatea.</p>':''}<p class="fee-note">${demo?'Demonstrație — nicio notificare nu este trimisă.':({sent:'Notificare email trimisă.',failed:'Notificarea email a eșuat. Comanda este salvată în panou.',pending:'Notificare email în așteptare.',not_configured:'Notificările email nu sunt configurate.'}[order.notification_status]||'')}</p>${terminal?'':`<div class="actions">${next?`<button class="primary" data-next="${next}">${actionLabels[next]}</button>`:''}<button id="cancelOrder" class="cancel">Anulează</button></div><form id="cancelForm" hidden><label for="cancelNote">Motivul anulării</label><textarea id="cancelNote" minlength="3" maxlength="240" required></textarea><div class="actions"><button type="submit" class="cancel">Confirmă anularea</button><button id="cancelBack" type="button" class="quiet">Înapoi</button></div></form>`}<hr><h3>Istoric</h3><ol id="history" class="history"><li>Se încarcă…</li></ol>`;
    const id=order.id;
    (demo?Promise.resolve({events:order.events}):api(`history?id=${encodeURIComponent(id)}`)).then(({events})=>{
      if(selected?.id!==id || !$('history')) return;
      $('history').innerHTML=events.map(event=>`<li>${esc(labels[event.to_status]||event.to_status)} · ${esc(time(event.created_at))}${event.note?`<small>${esc(event.note)}</small>`:''}</li>`).join('') || '<li>Fără evenimente.</li>';
    }).catch(()=>{if(selected?.id===id && $('history')) $('history').textContent='Istoricul nu este disponibil momentan.';});
  }
  async function update(status,note='') {
    if(busy || !selected) return;
    busy=true;const order=selected;let updateError='';showError('');
    $('detail').querySelectorAll('button,textarea').forEach(element=>element.disabled=true);
    try {
      if(demo) {order.status=status;order.version++;order.events.push({to_status:status,note,created_at:new Date().toISOString()});}
      else {const data=await api('orders',{method:'PATCH',body:JSON.stringify({id:order.id,version:order.version,status,note})});selected=data.order;}
      renderDetail();
    } catch(error) {updateError=error.message==='VERSION_CONFLICT'?'Un coleg a modificat comanda. Verifică starea actualizată înainte să continui.':'Modificarea nu a fost salvată. Verifică starea comenzii și încearcă din nou.';}
    finally {busy=false;await load();if(updateError)showError(updateError);}
  }
  $('loginForm').addEventListener('submit',async event=>{
    event.preventDefault();$('signIn').disabled=true;$('loginMessage').textContent='Se verifică…';
    try {const data=await api('session',{method:'POST',body:JSON.stringify({email:$('email').value.trim(),password:$('password').value})});demo=false;$('password').value='';$('loginMessage').textContent='';enter(data.staff);}
    catch(error) {$('password').value='';$('loginMessage').textContent=error.message==='SETUP_REQUIRED'?'Conturile de personal nu sunt încă activate.':'Conectarea a eșuat. Verifică datele și accesul aprobat.';}
    finally {$('signIn').disabled=false;}
  });
  $('demo').addEventListener('click',()=>{demo=true;demoOrders=makeDemo();enter({});});
  $('exitDemo').addEventListener('click',()=>{demo=false;showLogin();});
  $('logout').addEventListener('click',async()=>{try {await api('session',{method:'DELETE',body:'{}'});showLogin();}catch {showError('Ieșirea nu a putut fi confirmată. Încearcă din nou.');}});
  $('refresh').addEventListener('click',load);
  $('statusFilter').addEventListener('change',()=>{revision++;offset=0;selected=null;renderEmpty();load();});
  $('search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{revision++;offset=0;selected=null;renderEmpty();load();},300);});
  $('previous').addEventListener('click',()=>{offset=Math.max(0,offset-50);load();});
  $('next').addEventListener('click',()=>{offset+=50;load();});
  $('orderList').addEventListener('click',event=>{if(busy)return;const button=event.target.closest('[data-order]');if(button){selected=orders.find(order=>order.id===button.dataset.order);renderList();renderDetail();if(window.matchMedia('(max-width:850px)').matches) $('detail').scrollIntoView({behavior:'smooth',block:'start'});}});
  $('detail').addEventListener('click',event=>{const action=event.target.closest('[data-next]');if(action)update(action.dataset.next);if(event.target.id==='cancelOrder'){$('cancelForm').hidden=false;$('cancelNote').focus();}if(event.target.id==='cancelBack')$('cancelForm').hidden=true;});
  $('detail').addEventListener('submit',event=>{if(event.target.id==='cancelForm'){event.preventDefault();if($('cancelNote').value.trim().length>=3)update('cancelled',$('cancelNote').value.trim());}});
  setInterval(()=>{if(!document.hidden && !demo && !document.activeElement?.closest('#cancelForm'))load();},15000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)load();});
  $('signIn').disabled=true;
  api('session').then(data=>{
    $('setup').hidden=data.ready;$('signIn').disabled=!data.ready;$('email').disabled=!data.ready;$('password').disabled=!data.ready;
    if(data.staff)enter(data.staff);
  }).catch(()=>{$('loginMessage').textContent='Conectare indisponibilă momentan. Reîncarcă pagina pentru a încerca din nou.';});
})();
