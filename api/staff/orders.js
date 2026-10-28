import {secureResponse,sameOrigin,fail,requireStaff,request,HttpError} from '../../server/backend.mjs';
const statuses=['active','all','new','accepted','preparing','ready','out_for_delivery','completed','cancelled'];
export default async function handler(req,res) {
  secureResponse(res);
  try {
    if(!['GET','PATCH'].includes(req.method)) throw new HttpError(405,'METHOD_NOT_ALLOWED');
    if(req.method==='PATCH') sameOrigin(req);
    const staff=await requireStaff(req,res);
    if(req.method==='GET') {
      const url=new URL(req.url,'https://staff.local');
      const status=url.searchParams.get('status')||'active';
      const search=(url.searchParams.get('search')||'').trim();
      const offset=Number(url.searchParams.get('offset')||0);
      if(!statuses.includes(status) || search.length>100 || !Number.isInteger(offset) || offset<0 || offset>10000) throw new HttpError(400,'INVALID_FILTER');
      return res.status(200).json(await request('rpc/staff_order_snapshot',{method:'POST',body:{p_status:status,p_search:search,p_offset:offset}}));
    }
    const {id,version,status,note=''}=req.body||{};
    if(!/^[\da-f-]{36}$/i.test(id||'') || !Number.isInteger(version) || version<0 || !statuses.slice(2).includes(status) || typeof note!=='string' || note.length>240) throw new HttpError(400,'INVALID_UPDATE');
    const order=await request('rpc/staff_change_order_status',{method:'POST',body:{p_id:id,p_version:version,p_status:status,p_actor:staff.user_id,p_note:note}});
    return res.status(200).json({order});
  }catch(e) {return fail(res,e);}
}
