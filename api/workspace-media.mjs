import upload from './_upload-handler.mjs';
import direct from './_upload-direct-handler.mjs';

export default async function handler(req,res){
  const url=new URL(req.url||'/api/workspace-media',`https://${req.headers?.host||'localhost'}`);
  return url.searchParams.get('mode')==='direct' ? direct(req,res) : upload(req,res);
}
