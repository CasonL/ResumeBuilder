module.exports=[93695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},70406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},18622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},50502,e=>{"use strict";var t=e.i(26500);let r="casonlamothe@gmail.com";async function a(e,a){let s=await (0,t.createClient)(),{data:i}=await s.from("users").select("id").eq("id",e).single();i?a===r&&await s.from("users").update({is_admin:!0}).eq("id",e).eq("is_admin",!1):await s.from("users").insert({id:e,email:a,credits:3,is_admin:a===r})}async function s(){let e=await (0,t.createClient)(),{data:{user:r},error:a}=await e.auth.getUser();return a||!r?null:r}async function i(){let e=await s();if(!e)return null;await a(e.id,e.email||"");let r=await (0,t.createClient)(),{data:i,error:n}=await r.from("users").select("*").eq("id",e.id).single();return n||!i?null:{...e,...i}}async function n(){let e=await i();if(!e?.is_admin)throw Error("Admin privileges required");return e}e.s(["ensureUserExists",()=>a,"getCurrentUser",()=>s,"requireAdmin",()=>n])},24361,(e,t,r)=>{t.exports=e.x("util",()=>require("util"))},2157,(e,t,r)=>{t.exports=e.x("node:fs",()=>require("node:fs"))},81111,(e,t,r)=>{t.exports=e.x("node:stream",()=>require("node:stream"))},87457,e=>{"use strict";var t=e.i(47909),r=e.i(74017),a=e.i(96250),s=e.i(59756),i=e.i(61916),n=e.i(74677),o=e.i(69741),l=e.i(16795),d=e.i(87718),u=e.i(95169),c=e.i(47587),p=e.i(66012),m=e.i(70101),h=e.i(74838),f=e.i(10372),g=e.i(93695);e.i(52474);var E=e.i(5232),R=e.i(89171),v=e.i(89228),x=e.i(50502);let w=new v.default({apiKey:process.env.OPENAI_API_KEY});async function y(e){try{if(!await (0,x.getCurrentUser)())return R.NextResponse.json({error:"Authentication required"},{status:401});let{jobDescription:t,resumeContent:r,masterData:a,critique:s}=await e.json();if(!process.env.OPENAI_API_KEY)return R.NextResponse.json({error:"OpenAI API key not configured"},{status:500});if(!t||!r||!a||!s)return R.NextResponse.json({error:"Job description, resume content, master data, and critique are required"},{status:400});let i=`You are a resume expert. Apply the critique feedback to improve this resume WITHOUT adding placeholders or buzzword inflation.

JOB DESCRIPTION:
${t}

CURRENT RESUME CONTENT:
${JSON.stringify(r,null,2)}

USER'S MASTER DATA:
${JSON.stringify(a,null,2)}

CRITIQUE FEEDBACK:
${JSON.stringify(s,null,2)}

Your task: Apply the critique to create a MORE CREDIBLE version of the resume.

CRITICAL RULES - NEVER VIOLATE:

1. **NEVER ADD PLACEHOLDERS**
   - NO "[X]%", NO "[metric]", NO "[outcome]"
   - If master data doesn't have a specific metric, keep it qualitative or don't add it
   - Better to be specific without numbers than vague with placeholders

2. **PRESERVE CONCRETE LANGUAGE**
   - If original bullet is specific and differentiated, keep that specificity
   - "60+ customer conversations" is BETTER than "extensive customer research"
   - "Scenario-based assessments" is BETTER than "performance evaluation tools"
   - Don't trade concrete nouns for abstract buzzwords

3. **AVOID BUZZWORD INFLATION**
   - Only add keywords that genuinely fit and the master data supports
   - "Led product discovery" ONLY if master data shows discovery work
   - "Data-driven" ONLY if master data shows actual measurement/metrics
   - When in doubt, keep original phrasing

4. **CREDIBILITY > OPTIMIZATION**
   - A plain, specific bullet is better than a keyword-stuffed generic one
   - If critique suggests something master data can't support, DON'T add it
   - Prefer reframing over adding new claims

WHEN TO MAKE CHANGES (high confidence only):

✓ Update education focus if critique suggests better role alignment
✓ Replace truly generic skills (Excel, Teams) with role behaviors IF master data supports
✓ Reframe technical language as product language IF master data shows product thinking
✓ Add artifacts/deliverables IF explicitly mentioned in master data
✓ Strengthen verbs (managed → designed, led → architected) IF role context supports

WHEN TO KEEP ORIGINAL (preserve specificity):

✓ Keep specific numbers, conversations, team sizes, timeframes
✓ Keep concrete project/feature names
✓ Keep differentiated language ("scenario-based", "multi-agent", specific tools)
✓ Keep bullets that are already strong and credible

APPLYING CRITIQUE:

If critique says: "Missing metrics in PitchIQ"
And master data has: customer conversations, iterations, but NO activation rates
GOOD: "Built and iterated AI roleplay product through 60+ customer interviews and weekly refinement cycles"
BAD: "Built AI product, increasing user engagement by [X]%"

If critique says: "Skills too generic"
And master data shows: customer interviews, product iterations, prioritization
GOOD: Replace ["Excel", "PowerPoint"] → ["Customer discovery", "Product prioritization", "Iterative development"]
BAD: Replace → ["Data-driven decision making", "Strategic thinking", "Outcome measurement"] (unless master data proves these)

If critique says: "Top section needs PM hook"
GOOD: Update educationFocus to "Product Strategy & Systems Thinking"
BAD: "Data-Driven Product Strategy & Metrics" (if no metrics in experience)

Return VALID JSON with the SAME structure as the original resume content, but with CREDIBLE improvements:
{
  "resumeName": "string",
  "selectedExperiences": ["same IDs as input"],
  "selectedLeadership": ["same IDs as input"],
  "selectedProjects": ["same IDs as input"],
  "selectedSkills": ["improved skills - concrete behaviors only"],
  "tailoringNotes": {
    "keywords": ["updated based on critique"],
    "strengths": ["updated based on critique"],
    "recommendations": ["keep existing or enhance"],
    "warnings": ["keep existing"]
  },
  "customizations": {
    "educationFocus": "string - role-appropriate without false claims",
    "bulletPointAdjustments": {
      "experience-id": ["IMPROVED bullets - specific and credible, NO PLACEHOLDERS"]
    }
  },
  "refinementApplied": {
    "changesCount": number,
    "majorImprovements": ["list of 3-5 key changes made"],
    "critiqueAddressed": ["list of critique points that were applied"],
    "preservedSpecificity": ["list of 2-3 concrete details from original that were kept"]
  }
}`,n=(await w.chat.completions.create({model:"gpt-4o",messages:[{role:"system",content:"You are an expert resume consultant who applies feedback systematically and precisely. Return valid JSON only."},{role:"user",content:i}],response_format:{type:"json_object"},temperature:.5})).choices[0].message.content;if(!n)throw Error("No response from OpenAI");let o=JSON.parse(n);return R.NextResponse.json({success:!0,data:o})}catch(e){return console.error("Resume refinement error:",e),R.NextResponse.json({error:"Failed to refine resume",details:e instanceof Error?e.message:"Unknown error"},{status:500})}}e.s(["POST",()=>y],36e3);var A=e.i(36e3);let I=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/refine-resume/route",pathname:"/api/refine-resume",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/refine-resume/route.ts",nextConfigOutput:"standalone",userland:A}),{workAsyncStorage:O,workUnitAsyncStorage:N,serverHooks:b}=I;function C(){return(0,a.patchFetch)({workAsyncStorage:O,workUnitAsyncStorage:N})}async function T(e,t,a){I.isDev&&(0,s.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let R="/api/refine-resume/route";R=R.replace(/\/index$/,"")||"/";let v=await I.prepare(e,t,{srcPage:R,multiZoneDraftMode:!1});if(!v)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:x,params:w,nextConfig:y,parsedUrl:A,isDraftMode:O,prerenderManifest:N,routerServerContext:b,isOnDemandRevalidate:C,revalidateOnlyGenerated:T,resolvedPathname:P,clientReferenceManifest:k,serverActionsManifest:S}=v,q=(0,o.normalizeAppPath)(R),D=!!(N.dynamicRoutes[q]||N.routes[P]),_=async()=>((null==b?void 0:b.render404)?await b.render404(e,t,A,!1):t.end("This page could not be found"),null);if(D&&!O){let e=!!N.routes[P],t=N.dynamicRoutes[q];if(t&&!1===t.fallback&&!e){if(y.experimental.adapterPath)return await _();throw new g.NoFallbackError}}let U=null;!D||I.isDev||O||(U="/index"===(U=P)?"/":U);let j=!0===I.isDev||!D,L=D&&!j;S&&k&&(0,n.setManifestsSingleton)({page:R,clientReferenceManifest:k,serverActionsManifest:S});let H=e.method||"GET",M=(0,i.getTracer)(),B=M.getActiveScopeSpan(),K={params:w,prerenderManifest:N,renderOpts:{experimental:{authInterrupts:!!y.experimental.authInterrupts},cacheComponents:!!y.cacheComponents,supportsDynamicResponse:j,incrementalCache:(0,s.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:y.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,a,s)=>I.onRequestError(e,t,a,s,b)},sharedContext:{buildId:x}},F=new l.NodeNextRequest(e),$=new l.NodeNextResponse(t),G=d.NextRequestAdapter.fromNodeNextRequest(F,(0,d.signalFromNodeResponse)(t));try{let n=async e=>I.handle(G,K).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=M.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==u.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=r.get("next.route");if(a){let t=`${H} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t)}else e.updateName(`${H} ${R}`)}),o=!!(0,s.getRequestMeta)(e,"minimalMode"),l=async s=>{var i,l;let d=async({previousCacheEntry:r})=>{try{if(!o&&C&&T&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let i=await n(s);e.fetchMetrics=K.renderOpts.fetchMetrics;let l=K.renderOpts.pendingWaitUntil;l&&a.waitUntil&&(a.waitUntil(l),l=void 0);let d=K.renderOpts.collectedTags;if(!D)return await (0,p.sendResponse)(F,$,i,K.renderOpts.pendingWaitUntil),null;{let e=await i.blob(),t=(0,m.toNodeOutgoingHttpHeaders)(i.headers);d&&(t[f.NEXT_CACHE_TAGS_HEADER]=d),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==K.renderOpts.collectedRevalidate&&!(K.renderOpts.collectedRevalidate>=f.INFINITE_CACHE)&&K.renderOpts.collectedRevalidate,a=void 0===K.renderOpts.collectedExpire||K.renderOpts.collectedExpire>=f.INFINITE_CACHE?void 0:K.renderOpts.collectedExpire;return{value:{kind:E.CachedRouteKind.APP_ROUTE,status:i.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:a}}}}catch(t){throw(null==r?void 0:r.isStale)&&await I.onRequestError(e,t,{routerKind:"App Router",routePath:R,routeType:"route",revalidateReason:(0,c.getRevalidateReason)({isStaticGeneration:L,isOnDemandRevalidate:C})},!1,b),t}},u=await I.handleResponse({req:e,nextConfig:y,cacheKey:U,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:N,isRoutePPREnabled:!1,isOnDemandRevalidate:C,revalidateOnlyGenerated:T,responseGenerator:d,waitUntil:a.waitUntil,isMinimalMode:o});if(!D)return null;if((null==u||null==(i=u.value)?void 0:i.kind)!==E.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==u||null==(l=u.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});o||t.setHeader("x-nextjs-cache",C?"REVALIDATED":u.isMiss?"MISS":u.isStale?"STALE":"HIT"),O&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let g=(0,m.fromNodeOutgoingHttpHeaders)(u.value.headers);return o&&D||g.delete(f.NEXT_CACHE_TAGS_HEADER),!u.cacheControl||t.getHeader("Cache-Control")||g.get("Cache-Control")||g.set("Cache-Control",(0,h.getCacheControlHeader)(u.cacheControl)),await (0,p.sendResponse)(F,$,new Response(u.value.body,{headers:g,status:u.value.status||200})),null};B?await l(B):await M.withPropagatedContext(e.headers,()=>M.trace(u.BaseServerSpan.handleRequest,{spanName:`${H} ${R}`,kind:i.SpanKind.SERVER,attributes:{"http.method":H,"http.target":e.url}},l))}catch(t){if(t instanceof g.NoFallbackError||await I.onRequestError(e,t,{routerKind:"App Router",routePath:q,routeType:"route",revalidateReason:(0,c.getRevalidateReason)({isStaticGeneration:L,isOnDemandRevalidate:C})},!1,b),D)throw t;return await (0,p.sendResponse)(F,$,new Response(null,{status:500})),null}}e.s(["handler",()=>T,"patchFetch",()=>C,"routeModule",()=>I,"serverHooks",()=>b,"workAsyncStorage",()=>O,"workUnitAsyncStorage",()=>N],87457)},19124,e=>{e.v(t=>Promise.all(["server/chunks/[root-of-the-server]__826cbbc8._.js"].map(t=>e.l(t))).then(()=>t(18870)))}];

//# sourceMappingURL=%5Broot-of-the-server%5D__7a499168._.js.map