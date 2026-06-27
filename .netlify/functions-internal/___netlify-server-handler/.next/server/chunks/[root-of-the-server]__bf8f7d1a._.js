module.exports=[93695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},70406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},18622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},50502,e=>{"use strict";var t=e.i(26500);let r="casonlamothe@gmail.com";async function a(e,a){let n=await (0,t.createClient)(),{data:i}=await n.from("users").select("id").eq("id",e).single();i?a===r&&await n.from("users").update({is_admin:!0}).eq("id",e).eq("is_admin",!1):await n.from("users").insert({id:e,email:a,credits:3,is_admin:a===r})}async function n(){let e=await (0,t.createClient)(),{data:{user:r},error:a}=await e.auth.getUser();return a||!r?null:r}async function i(){let e=await n();if(!e)return null;await a(e.id,e.email||"");let r=await (0,t.createClient)(),{data:i,error:s}=await r.from("users").select("*").eq("id",e.id).single();return s||!i?null:{...e,...i}}async function s(){let e=await i();if(!e?.is_admin)throw Error("Admin privileges required");return e}e.s(["ensureUserExists",()=>a,"getCurrentUser",()=>n,"requireAdmin",()=>s])},24361,(e,t,r)=>{t.exports=e.x("util",()=>require("util"))},2157,(e,t,r)=>{t.exports=e.x("node:fs",()=>require("node:fs"))},81111,(e,t,r)=>{t.exports=e.x("node:stream",()=>require("node:stream"))},28047,e=>{"use strict";var t=e.i(47909),r=e.i(74017),a=e.i(96250),n=e.i(59756),i=e.i(61916),s=e.i(74677),o=e.i(69741),l=e.i(16795),c=e.i(87718),d=e.i(95169),u=e.i(47587),p=e.i(66012),h=e.i(70101),m=e.i(74838),f=e.i(10372),y=e.i(93695);e.i(52474);var g=e.i(5232),x=e.i(89171),v=e.i(89228),E=e.i(50502);let R=new v.default({apiKey:process.env.OPENAI_API_KEY});async function w(e){try{if(!await (0,E.getCurrentUser)())return x.NextResponse.json({error:"Authentication required"},{status:401});let{jobDescription:t}=await e.json();if(!process.env.OPENAI_API_KEY)return x.NextResponse.json({error:"OpenAI API key not configured"},{status:500});if(!t)return x.NextResponse.json({error:"Job description is required"},{status:400});let r=`Analyze this job description and extract key attributes.

JOB DESCRIPTION:
${t}

Extract the following information and return VALID JSON:
{
  "industry": "string (e.g., Technology, Finance, Healthcare, Marketing, etc.)",
  "seniority": "string (Entry-level, Mid-level, Senior, Director, Executive)",
  "yearsRequired": "string (e.g., '0-2', '3-5', '5+', '10+')",
  "companyType": "string (Startup, SMB, Enterprise, Agency, Non-profit)",
  "cultureTone": "string (Formal, Casual, Innovative, Traditional)",
  "keyRequirements": ["array of 5-8 most important requirements/skills from job description"],
  "emphasizedAreas": ["array of areas heavily emphasized: e.g., 'Technical Skills', 'Leadership', 'Project Management', 'Certifications', 'Education']
}

Be precise and base analysis only on what's in the job description.`,a=await R.chat.completions.create({model:"gpt-4o-mini",messages:[{role:"system",content:"You are a job description analyzer. Extract structured attributes. Return valid JSON only."},{role:"user",content:r}],response_format:{type:"json_object"},temperature:.1}),n=JSON.parse(a.choices[0].message.content||"{}"),i=`Based on these job attributes, recommend optimal resume preferences.

JOB ATTRIBUTES:
${JSON.stringify(n,null,2)}

Generate smart recommendations and return VALID JSON:
{
  "targetLength": "1-page" or "2-page",
  "layoutStyle": "balanced-columns" or "content-heavy" or "sidebar-focus",
  "tone": "professional" or "creative" or "technical",
  "prioritySections": ["array of sections to prioritize from: Work Experience, Leadership, Projects, Technical Skills, Certifications"],
  "reasoning": {
    "length": "Brief explanation why this length is recommended",
    "layout": "Brief explanation why this layout suits the role",
    "tone": "Brief explanation why this tone fits the company/role",
    "sections": "Brief explanation which sections matter most"
  }
}

STRICT RECOMMENDATION LOGIC (FOLLOW EXACTLY):

**Length:**
- Entry/Mid-level (0-5 years) → 1-page
- Senior+ (5+ years) → 2-page

**Layout:**
- Tech/Engineering roles → balanced-columns
- Creative/Design/Marketing → sidebar-focus
- Corporate/Business/Finance → content-heavy

**Tone:**
- Startup/Innovative culture → creative
- Traditional/Enterprise/Formal → professional
- Heavy technical requirements → technical

**Priority Sections (FOLLOW THESE RULES):**
1. Select 2-4 sections from: Work Experience, Leadership, Projects, Technical Skills, Certifications
2. Map emphasizedAreas to sections:
   - "Technical Skills" or "Certifications" → include "Technical Skills"
   - "Leadership" or "Management" → include "Leadership"
   - "Project Management" or "Projects" → include "Projects"
   - "Certifications" or "Professional Development" → include "Certifications"
3. Work Experience is important but NOT mandatory - only include if emphasizedAreas mentions work history, experience, or if no other clear priorities
4. Prioritize sections that match emphasizedAreas most directly
5. If emphasizedAreas is vague, default to: ["Work Experience", "Technical Skills"]

**Examples:**

emphasizedAreas: ["Technical Skills", "Leadership", "Project Management"]
→ prioritySections: ["Technical Skills", "Leadership", "Projects"]

emphasizedAreas: ["Certifications", "Technical Skills"]
→ prioritySections: ["Technical Skills", "Certifications"]

emphasizedAreas: ["Leadership", "Management Experience"]
→ prioritySections: ["Work Experience", "Leadership"]

emphasizedAreas: ["Project Delivery", "Technical Skills", "Certifications"]
→ prioritySections: ["Projects", "Technical Skills", "Certifications"]

Be consistent but flexible. Match the job's actual priorities, not a rigid formula.`,s=await R.chat.completions.create({model:"gpt-4o-mini",messages:[{role:"system",content:"You are a resume strategy consultant. Generate optimal recommendations based on job analysis. Return valid JSON only."},{role:"user",content:i}],response_format:{type:"json_object"},temperature:.1}),o=JSON.parse(s.choices[0].message.content||"{}");return x.NextResponse.json({jobAttributes:n,recommendations:o})}catch(e){return console.error("Job description analysis error:",e),x.NextResponse.json({error:"Failed to analyze job description"},{status:500})}}e.s(["POST",()=>w],2355);var C=e.i(2355);let b=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/analyze-job-description/route",pathname:"/api/analyze-job-description",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/analyze-job-description/route.ts",nextConfigOutput:"standalone",userland:C}),{workAsyncStorage:S,workUnitAsyncStorage:A,serverHooks:T}=b;function j(){return(0,a.patchFetch)({workAsyncStorage:S,workUnitAsyncStorage:A})}async function k(e,t,a){b.isDev&&(0,n.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let x="/api/analyze-job-description/route";x=x.replace(/\/index$/,"")||"/";let v=await b.prepare(e,t,{srcPage:x,multiZoneDraftMode:!1});if(!v)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:E,params:R,nextConfig:w,parsedUrl:C,isDraftMode:S,prerenderManifest:A,routerServerContext:T,isOnDemandRevalidate:j,revalidateOnlyGenerated:k,resolvedPathname:P,clientReferenceManifest:O,serverActionsManifest:N}=v,q=(0,o.normalizeAppPath)(x),_=!!(A.dynamicRoutes[q]||A.routes[P]),I=async()=>((null==T?void 0:T.render404)?await T.render404(e,t,C,!1):t.end("This page could not be found"),null);if(_&&!S){let e=!!A.routes[P],t=A.dynamicRoutes[q];if(t&&!1===t.fallback&&!e){if(w.experimental.adapterPath)return await I();throw new y.NoFallbackError}}let L=null;!_||b.isDev||S||(L="/index"===(L=P)?"/":L);let M=!0===b.isDev||!_,U=_&&!M;N&&O&&(0,s.setManifestsSingleton)({page:x,clientReferenceManifest:O,serverActionsManifest:N});let D=e.method||"GET",z=(0,i.getTracer)(),H=z.getActiveScopeSpan(),B={params:R,prerenderManifest:A,renderOpts:{experimental:{authInterrupts:!!w.experimental.authInterrupts},cacheComponents:!!w.cacheComponents,supportsDynamicResponse:M,incrementalCache:(0,n.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:w.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,a,n)=>b.onRequestError(e,t,a,n,T)},sharedContext:{buildId:E}},F=new l.NodeNextRequest(e),J=new l.NodeNextResponse(t),K=c.NextRequestAdapter.fromNodeNextRequest(F,(0,c.signalFromNodeResponse)(t));try{let s=async e=>b.handle(K,B).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=z.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==d.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=r.get("next.route");if(a){let t=`${D} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t)}else e.updateName(`${D} ${x}`)}),o=!!(0,n.getRequestMeta)(e,"minimalMode"),l=async n=>{var i,l;let c=async({previousCacheEntry:r})=>{try{if(!o&&j&&k&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let i=await s(n);e.fetchMetrics=B.renderOpts.fetchMetrics;let l=B.renderOpts.pendingWaitUntil;l&&a.waitUntil&&(a.waitUntil(l),l=void 0);let c=B.renderOpts.collectedTags;if(!_)return await (0,p.sendResponse)(F,J,i,B.renderOpts.pendingWaitUntil),null;{let e=await i.blob(),t=(0,h.toNodeOutgoingHttpHeaders)(i.headers);c&&(t[f.NEXT_CACHE_TAGS_HEADER]=c),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==B.renderOpts.collectedRevalidate&&!(B.renderOpts.collectedRevalidate>=f.INFINITE_CACHE)&&B.renderOpts.collectedRevalidate,a=void 0===B.renderOpts.collectedExpire||B.renderOpts.collectedExpire>=f.INFINITE_CACHE?void 0:B.renderOpts.collectedExpire;return{value:{kind:g.CachedRouteKind.APP_ROUTE,status:i.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:a}}}}catch(t){throw(null==r?void 0:r.isStale)&&await b.onRequestError(e,t,{routerKind:"App Router",routePath:x,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:U,isOnDemandRevalidate:j})},!1,T),t}},d=await b.handleResponse({req:e,nextConfig:w,cacheKey:L,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:A,isRoutePPREnabled:!1,isOnDemandRevalidate:j,revalidateOnlyGenerated:k,responseGenerator:c,waitUntil:a.waitUntil,isMinimalMode:o});if(!_)return null;if((null==d||null==(i=d.value)?void 0:i.kind)!==g.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(l=d.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});o||t.setHeader("x-nextjs-cache",j?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),S&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let y=(0,h.fromNodeOutgoingHttpHeaders)(d.value.headers);return o&&_||y.delete(f.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||t.getHeader("Cache-Control")||y.get("Cache-Control")||y.set("Cache-Control",(0,m.getCacheControlHeader)(d.cacheControl)),await (0,p.sendResponse)(F,J,new Response(d.value.body,{headers:y,status:d.value.status||200})),null};H?await l(H):await z.withPropagatedContext(e.headers,()=>z.trace(d.BaseServerSpan.handleRequest,{spanName:`${D} ${x}`,kind:i.SpanKind.SERVER,attributes:{"http.method":D,"http.target":e.url}},l))}catch(t){if(t instanceof y.NoFallbackError||await b.onRequestError(e,t,{routerKind:"App Router",routePath:q,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:U,isOnDemandRevalidate:j})},!1,T),_)throw t;return await (0,p.sendResponse)(F,J,new Response(null,{status:500})),null}}e.s(["handler",()=>k,"patchFetch",()=>j,"routeModule",()=>b,"serverHooks",()=>T,"workAsyncStorage",()=>S,"workUnitAsyncStorage",()=>A],28047)},19124,e=>{e.v(t=>Promise.all(["server/chunks/[root-of-the-server]__826cbbc8._.js"].map(t=>e.l(t))).then(()=>t(18870)))}];

//# sourceMappingURL=%5Broot-of-the-server%5D__bf8f7d1a._.js.map