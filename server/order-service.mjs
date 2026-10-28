import {createHash} from 'node:crypto';
import catalog from './menu-catalog.mjs';
import {request,HttpError} from './backend.mjs';
import {normalizeOrder} from '../api/send-telegram.js';
export function canonicalOrder(body) {
  let order;try{order=normalizeOrder(body);}catch{throw new HttpError(400,'INVALID_ORDER');}
  order.cart=order.cart.map((line,i)=>{
    const raw=body.cart[i];
    const item=catalog.find(x=>x.id===raw.id);
    if(!item) throw new HttpError(400,'INVALID_ORDER');
    if(line.price!==item.price) throw new HttpError(409,'PRICE_CHANGED');
    let selectedSummary='';
    if(item.isBusinessLunch) {
      if(!Number.isInteger(raw.firstIndex) || !Number.isInteger(raw.secondIndex) || !item.firstCourses.ro[raw.firstIndex] || !item.secondCourses.ro[raw.secondIndex]) throw new HttpError(400,'INVALID_ORDER');
      selectedSummary=[item.firstCourses.ro[raw.firstIndex],item.secondCourses.ro[raw.secondIndex],item.additional.ro[0]].join(' + ');
    }
    return {id:item.id,name:item.name,price:item.price,qty:line.qty,...(selectedSummary?{selectedSummary}:{})};
  });
  order.total=order.cart.reduce((sum,x)=>sum+x.price*x.qty,0);
  return order;
}
export async function saveOrder(body) {
  const order=canonicalOrder(body);
  if(!/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(body.requestId||'')) throw new HttpError(400,'INVALID_REQUEST_ID');
  const digest=createHash('sha256').update(JSON.stringify(order)).digest('hex');
  const saved=await request('rpc/create_restaurant_order',{method:'POST',body:{p_request_id:body.requestId,p_digest:digest,p_order:order}});
  // An email failure must never undo a recorded order or ask the customer to submit again.
  if(saved.created) await notify(saved.order).catch(()=>{});
  return {status:'success',reference:`TK-${saved.order.order_number}`};
}
export async function notify(order) {
  const recipients=(process.env.ORDER_NOTIFICATION_EMAILS||'').split(',').map(x=>x.trim()).filter(Boolean);
  const configured=Boolean(process.env.RESEND_API_KEY && process.env.ORDER_EMAIL_FROM && recipients.length);
  let state='not_configured';
  if(configured) {
    const modes={delivery:'Livrare',pickup:'Ridicare',dine_in:'În restaurant'};
    const text=[`Comandă TK-${order.order_number} • ${modes[order.fulfillment]}`,`Client: ${order.customer_name}`,`Telefon: ${order.customer_phone}`,
      ...(order.delivery?[`Adresă: ${Object.values(order.delivery).filter(Boolean).join(', ')}`]:[]),
      ...order.items.map(x=>`${x.qty} × ${x.name}${x.selectedSummary?' ('+x.selectedSummary+')':''} — ${x.qty*x.price} lei`),
      `Subtotal: ${order.subtotal} lei`,order.fulfillment==='delivery'?'Livrarea se confirmă telefonic.':'',order.notes,
      'Gestionează comanda: https://tashkent-caravan.vercel.app/staff'].filter(Boolean).join('\n');
    try {
      const response=await fetch('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(10000),headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`order-${order.id}`},body:JSON.stringify({from:process.env.ORDER_EMAIL_FROM,to:recipients,subject:`Tashkent • comandă TK-${order.order_number}`,text})});
      state=response.ok?'sent':'failed';
    }catch{state='failed';}
  }
  await request(`restaurant_orders?id=eq.${order.id}`,{method:'PATCH',body:{notification_status:state},headers:{Prefer:'return=minimal'}});
  return state;
}
