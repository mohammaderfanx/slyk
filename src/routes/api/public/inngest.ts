import {createFileRoute} from "@tanstack/react-router";
async function handler(request:Request){
 const {ecosystemHandler}=await import("@/lib/ecosystem-jobs.server");
 return ecosystemHandler()(request);
}
export const Route=createFileRoute("/api/public/inngest")({server:{handlers:{GET:({request})=>handler(request),POST:({request})=>handler(request),PUT:({request})=>handler(request)}}});