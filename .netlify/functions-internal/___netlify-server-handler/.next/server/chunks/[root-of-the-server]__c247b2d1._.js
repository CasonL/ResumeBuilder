module.exports=[93695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},70406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},18622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},24361,(e,t,r)=>{t.exports=e.x("util",()=>require("util"))},2157,(e,t,r)=>{t.exports=e.x("node:fs",()=>require("node:fs"))},81111,(e,t,r)=>{t.exports=e.x("node:stream",()=>require("node:stream"))},79832,e=>{"use strict";var t=e.i(26500);async function r(e,t){return console.warn("auth.signup is deprecated - use Supabase Auth directly"),{success:!1,error:"Use Supabase Auth directly"}}async function a(e,t){return console.warn("auth.login is deprecated - use Supabase Auth directly"),{success:!1,error:"Use Supabase Auth directly"}}async function n(e){console.warn("setSessionCookie is deprecated - Supabase handles sessions")}async function s(){let e=await (0,t.createClient)(),{data:{user:r},error:a}=await e.auth.getUser();return a||!r?null:{userId:r.id,email:r.email||""}}async function o(){console.warn("clearSession is deprecated - use Supabase signOut")}async function i(){let e=await s();if(!e)throw Error("Not authenticated");return e}e.s(["clearSession",()=>o,"getSession",()=>s,"login",()=>a,"requireAuth",()=>i,"setSessionCookie",()=>n,"signup",()=>r])},23093,e=>{"use strict";var t=e.i(47909),r=e.i(74017),a=e.i(96250),n=e.i(59756),s=e.i(61916),o=e.i(74677),i=e.i(69741),l=e.i(16795),c=e.i(87718),u=e.i(95169),d=e.i(47587),p=e.i(66012),m=e.i(70101),h=e.i(74838),f=e.i(10372),x=e.i(93695);e.i(52474);var g=e.i(5232),y=e.i(89171),v=e.i(79832);let R=new(e.i(89228)).default({apiKey:process.env.OPENAI_API_KEY});async function E(e){try{if(await (0,v.requireAuth)(),!process.env.OPENAI_API_KEY)return y.NextResponse.json({error:"OpenAI API key not configured"},{status:500});let{resumeText:t}=await e.json();if(!t||!t.trim())return y.NextResponse.json({error:"Resume text is required"},{status:400});let r=`You are an expert resume parser. This is PASS 1 of 2 - focus on extracting ALL information comprehensively.

RESUME TEXT:
${t}

CRITICAL RULES FOR EXTRACTION:
- Extract ALL numerical data EXACTLY as written (dollar amounts, percentages, dates, team sizes)
- Keep ALL company names, role titles, certifications EXACTLY as spelled
- Preserve ALL bullet points under each experience - do NOT summarize
- Extract ALL skills mentioned
- Do NOT skip any information
- Do NOT modify or paraphrase - use exact text from resume

Return VALID JSON with this EXACT structure:
{
  "personalInfo": {
    "name": "full name",
    "pronouns": "he/him or she/her if mentioned, otherwise empty string",
    "location": "city, state/province",
    "email": "email address",
    "phone": "phone number",
    "linkedin": "linkedin url or username",
    "summary": "professional summary or objective statement if present on resume, otherwise empty string"
  },
  "education": {
    "degree": "degree name",
    "institution": "university/college name",
    "dates": "graduation year or expected year",
    "focus": "major or focus area",
    "coursework": ["relevant course 1", "relevant course 2"]
  },
  "experiences": [
    {
      "id": "generate-a-kebab-case-id",
      "role": "job title",
      "company": "company name",
      "dates": "date range exactly as written",
      "bullets": ["bullet point 1", "bullet point 2", "..."],
      "tags": ["skill1", "skill2", "..."]
    }
  ],
  "leadership": [
    {
      "id": "generate-a-kebab-case-id",
      "role": "leadership role",
      "company": "organization name",
      "dates": "date range",
      "bullets": ["achievement 1", "achievement 2"],
      "tags": ["leadership", "skill1", "..."]
    }
  ],
  "projects": [
    {
      "id": "generate-a-kebab-case-id",
      "title": "project name",
      "description": "brief description",
      "bullets": ["detail 1", "detail 2"],
      "tags": ["technology1", "technology2"]
    }
  ],
  "skills": [
    {
      "category": "category name (e.g., 'Technical Skills', 'Tools', 'Core Strengths')",
      "items": ["skill 1", "skill 2", "..."]
    }
  ],
  "certifications": [
    {
      "name": "certification name",
      "details": "issuing organization or date if mentioned"
    }
  ],
  "achievements": [
    {
      "title": "achievement or award name",
      "description": "brief description or context",
      "date": "date or year if mentioned"
    }
  ],
  "hobbies": ["hobby 1", "hobby 2", "..."]
}

If leadership roles are mixed with work experience, separate them appropriately. Generate logical IDs in kebab-case format. Include hobbies/interests if mentioned. Include any notable achievements or awards.`,a=(await R.chat.completions.create({model:"gpt-4o",messages:[{role:"system",content:"You are a precise resume parser on PASS 1. Extract ALL information comprehensively. Return only valid JSON."},{role:"user",content:r}],response_format:{type:"json_object"},temperature:.2})).choices[0].message.content;if(!a)throw Error("No response from first pass");let n=JSON.parse(a),s=`You are validating resume data extraction. This is PASS 2 of 2 - verify accuracy and correct any errors.

ORIGINAL RESUME TEXT:
${t}

EXTRACTED DATA FROM PASS 1:
${JSON.stringify(n,null,2)}

VALIDATION TASKS:
1. Verify ALL numbers match the resume EXACTLY (dollar amounts, percentages, dates, team sizes)
2. Check company names, role titles are spelled correctly
3. Ensure bullets are assigned to the correct experience/role
4. Confirm no data was skipped or misplaced
5. Fix any errors found

CRITICAL RULES:
- If a number/stat is assigned to wrong experience, move it to the correct one
- Keep ALL data from pass 1, just fix placement/accuracy
- Do NOT add new information not in the resume
- Do NOT remove information that exists in the resume

Return the CORRECTED JSON in the same structure. Only fix errors - keep everything else identical.`,o=(await R.chat.completions.create({model:"gpt-4o",messages:[{role:"system",content:"You are validating extracted resume data on PASS 2. Fix any errors while preserving all information. Return only valid JSON."},{role:"user",content:s}],response_format:{type:"json_object"},temperature:.1})).choices[0].message.content;if(!o)throw Error("No response from second pass");let i=JSON.parse(o);return y.NextResponse.json({success:!0,profile:i,requiresConfirmation:!0})}catch(e){return console.error("Resume parsing error:",e),console.error("Error stack:",e instanceof Error?e.stack:"No stack"),y.NextResponse.json({error:"Failed to parse resume",details:e instanceof Error?e.message:"Unknown error",stack:e instanceof Error?e.stack:void 0},{status:500})}}e.s(["POST",()=>E],99722);var w=e.i(99722);let A=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/profile/parse-resume/route",pathname:"/api/profile/parse-resume",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/profile/parse-resume/route.ts",nextConfigOutput:"standalone",userland:w}),{workAsyncStorage:b,workUnitAsyncStorage:S,serverHooks:C}=A;function T(){return(0,a.patchFetch)({workAsyncStorage:b,workUnitAsyncStorage:S})}async function k(e,t,a){A.isDev&&(0,n.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let y="/api/profile/parse-resume/route";y=y.replace(/\/index$/,"")||"/";let v=await A.prepare(e,t,{srcPage:y,multiZoneDraftMode:!1});if(!v)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:R,params:E,nextConfig:w,parsedUrl:b,isDraftMode:S,prerenderManifest:C,routerServerContext:T,isOnDemandRevalidate:k,revalidateOnlyGenerated:N,resolvedPathname:O,clientReferenceManifest:I,serverActionsManifest:P}=v,j=(0,i.normalizeAppPath)(y),L=!!(C.dynamicRoutes[j]||C.routes[O]),_=async()=>((null==T?void 0:T.render404)?await T.render404(e,t,b,!1):t.end("This page could not be found"),null);if(L&&!S){let e=!!C.routes[O],t=C.dynamicRoutes[j];if(t&&!1===t.fallback&&!e){if(w.experimental.adapterPath)return await _();throw new x.NoFallbackError}}let q=null;!L||A.isDev||S||(q="/index"===(q=O)?"/":q);let U=!0===A.isDev||!L,D=L&&!U;P&&I&&(0,o.setManifestsSingleton)({page:y,clientReferenceManifest:I,serverActionsManifest:P});let H=e.method||"GET",M=(0,s.getTracer)(),K=M.getActiveScopeSpan(),F={params:E,prerenderManifest:C,renderOpts:{experimental:{authInterrupts:!!w.experimental.authInterrupts},cacheComponents:!!w.cacheComponents,supportsDynamicResponse:U,incrementalCache:(0,n.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:w.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,a,n)=>A.onRequestError(e,t,a,n,T)},sharedContext:{buildId:R}},$=new l.NodeNextRequest(e),X=new l.NodeNextResponse(t),Y=c.NextRequestAdapter.fromNodeNextRequest($,(0,c.signalFromNodeResponse)(t));try{let o=async e=>A.handle(Y,F).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=M.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==u.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=r.get("next.route");if(a){let t=`${H} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t)}else e.updateName(`${H} ${y}`)}),i=!!(0,n.getRequestMeta)(e,"minimalMode"),l=async n=>{var s,l;let c=async({previousCacheEntry:r})=>{try{if(!i&&k&&N&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let s=await o(n);e.fetchMetrics=F.renderOpts.fetchMetrics;let l=F.renderOpts.pendingWaitUntil;l&&a.waitUntil&&(a.waitUntil(l),l=void 0);let c=F.renderOpts.collectedTags;if(!L)return await (0,p.sendResponse)($,X,s,F.renderOpts.pendingWaitUntil),null;{let e=await s.blob(),t=(0,m.toNodeOutgoingHttpHeaders)(s.headers);c&&(t[f.NEXT_CACHE_TAGS_HEADER]=c),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==F.renderOpts.collectedRevalidate&&!(F.renderOpts.collectedRevalidate>=f.INFINITE_CACHE)&&F.renderOpts.collectedRevalidate,a=void 0===F.renderOpts.collectedExpire||F.renderOpts.collectedExpire>=f.INFINITE_CACHE?void 0:F.renderOpts.collectedExpire;return{value:{kind:g.CachedRouteKind.APP_ROUTE,status:s.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:a}}}}catch(t){throw(null==r?void 0:r.isStale)&&await A.onRequestError(e,t,{routerKind:"App Router",routePath:y,routeType:"route",revalidateReason:(0,d.getRevalidateReason)({isStaticGeneration:D,isOnDemandRevalidate:k})},!1,T),t}},u=await A.handleResponse({req:e,nextConfig:w,cacheKey:q,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:C,isRoutePPREnabled:!1,isOnDemandRevalidate:k,revalidateOnlyGenerated:N,responseGenerator:c,waitUntil:a.waitUntil,isMinimalMode:i});if(!L)return null;if((null==u||null==(s=u.value)?void 0:s.kind)!==g.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==u||null==(l=u.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});i||t.setHeader("x-nextjs-cache",k?"REVALIDATED":u.isMiss?"MISS":u.isStale?"STALE":"HIT"),S&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let x=(0,m.fromNodeOutgoingHttpHeaders)(u.value.headers);return i&&L||x.delete(f.NEXT_CACHE_TAGS_HEADER),!u.cacheControl||t.getHeader("Cache-Control")||x.get("Cache-Control")||x.set("Cache-Control",(0,h.getCacheControlHeader)(u.cacheControl)),await (0,p.sendResponse)($,X,new Response(u.value.body,{headers:x,status:u.value.status||200})),null};K?await l(K):await M.withPropagatedContext(e.headers,()=>M.trace(u.BaseServerSpan.handleRequest,{spanName:`${H} ${y}`,kind:s.SpanKind.SERVER,attributes:{"http.method":H,"http.target":e.url}},l))}catch(t){if(t instanceof x.NoFallbackError||await A.onRequestError(e,t,{routerKind:"App Router",routePath:j,routeType:"route",revalidateReason:(0,d.getRevalidateReason)({isStaticGeneration:D,isOnDemandRevalidate:k})},!1,T),L)throw t;return await (0,p.sendResponse)($,X,new Response(null,{status:500})),null}}e.s(["handler",()=>k,"patchFetch",()=>T,"routeModule",()=>A,"serverHooks",()=>C,"workAsyncStorage",()=>b,"workUnitAsyncStorage",()=>S],23093)},19124,e=>{e.v(t=>Promise.all(["server/chunks/[root-of-the-server]__826cbbc8._.js"].map(t=>e.l(t))).then(()=>t(18870)))}];

//# sourceMappingURL=%5Broot-of-the-server%5D__c247b2d1._.js.map