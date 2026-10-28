import {secureResponse,fail,requireStaff,request,HttpError} from '../../server/backend.mjs';
export default async function handler(req,res) {
  secureResponse(res);
  try {
    if(req.method!=='GET') throw new HttpError(405,'METHOD_NOT_ALLOWED');
    await requireStaff(req,res);
    const id=new URL(req.url,'https://staff.local').searchParams.get('id');
    if(!/^[\da-f-]{36}$/i.test(id||'')) throw new HttpError(400,'INVALID_ORDER');
    return res.status(200).json({events:await request(`order_events?order_id=eq.${id}&select=to_status,note,created_at&order=created_at.asc&limit=100`)});
  }catch(e) {return fail(res,e);}
}
