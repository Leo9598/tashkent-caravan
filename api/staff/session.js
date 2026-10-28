import {configured,request,secureResponse,sameOrigin,fail,clearSession,setSession,approvedUser,requireStaff,HttpError} from '../../server/backend.mjs';
export default async function handler(req,res) {
  secureResponse(res);
  try {
    if(req.method==='GET') {
      if(!configured()) return res.status(200).json({ready:false,staff:null});
      try {const staff=await requireStaff(req,res);return res.status(200).json({ready:true,staff});}
      catch(e) {if(e.status===401 || e.status===403) {clearSession(res);return res.status(200).json({ready:true,staff:null});} throw e;}
    }
    if(!['POST','DELETE'].includes(req.method)) throw new HttpError(405,'METHOD_NOT_ALLOWED');
    sameOrigin(req);
    if(req.method==='DELETE') {clearSession(res);return res.status(200).json({status:'success'});}
    if(!configured()) throw new HttpError(503,'SETUP_REQUIRED');
    const {email,password}=req.body || {};
    if(typeof email!=='string' || email.length>254 || typeof password!=='string' || password.length<8 || password.length>200) throw new HttpError(400,'SIGN_IN_FAILED');
    const session=await request('token?grant_type=password',{auth:true,method:'POST',body:{email:email.trim().toLowerCase(),password}});
    const staff=await approvedUser(session.access_token);setSession(res,session);
    return res.status(200).json({status:'success',staff});
  }catch(e) {return fail(res,e);}
}
