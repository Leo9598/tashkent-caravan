import telegram from './send-telegram.js';
import {configured,secureResponse,sameOrigin,fail,HttpError} from '../server/backend.mjs';
import {saveOrder,canonicalOrder} from '../server/order-service.mjs';
export default async function handler(req,res) {
  secureResponse(res);
  try {
    if(req.method!=='POST') throw new HttpError(405,'METHOD_NOT_ALLOWED');
    sameOrigin(req);
    if(!configured()) {
      // Preserve the existing restaurant notification channel until storage is activated.
      let order;try{order=canonicalOrder(req.body);}catch(e){throw e instanceof HttpError?e:new HttpError(400,'INVALID_ORDER');}
      req.body={...req.body,...order};
      return await telegram(req,res);
    }
    try {return res.status(200).json(await saveOrder(req.body));}
    catch(e){throw e instanceof HttpError?e:new HttpError(503,'SERVICE_UNAVAILABLE');}
  }catch(e) {return fail(res,e);}
}
