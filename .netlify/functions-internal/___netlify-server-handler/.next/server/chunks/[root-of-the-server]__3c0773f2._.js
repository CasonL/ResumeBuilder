module.exports=[93695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},70406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},18622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},50502,e=>{"use strict";var t=e.i(26500);let r="casonlamothe@gmail.com";async function a(e,a){let n=await (0,t.createClient)(),{data:s}=await n.from("users").select("id").eq("id",e).single();s?a===r&&await n.from("users").update({is_admin:!0}).eq("id",e).eq("is_admin",!1):await n.from("users").insert({id:e,email:a,credits:3,is_admin:a===r})}async function n(){let e=await (0,t.createClient)(),{data:{user:r},error:a}=await e.auth.getUser();return a||!r?null:r}async function s(){let e=await n();if(!e)return null;await a(e.id,e.email||"");let r=await (0,t.createClient)(),{data:s,error:i}=await r.from("users").select("*").eq("id",e.id).single();return i||!s?null:{...e,...s}}async function i(){let e=await s();if(!e?.is_admin)throw Error("Admin privileges required");return e}e.s(["ensureUserExists",()=>a,"getCurrentUser",()=>n,"requireAdmin",()=>i])},24361,(e,t,r)=>{t.exports=e.x("util",()=>require("util"))},2157,(e,t,r)=>{t.exports=e.x("node:fs",()=>require("node:fs"))},81111,(e,t,r)=>{t.exports=e.x("node:stream",()=>require("node:stream"))},71141,e=>{"use strict";var t=e.i(47909),r=e.i(74017),a=e.i(96250),n=e.i(59756),s=e.i(61916),i=e.i(74677),o=e.i(69741),l=e.i(16795),d=e.i(87718),c=e.i(95169),u=e.i(47587),p=e.i(66012),m=e.i(70101),f=e.i(74838),h=e.i(10372),x=e.i(93695);e.i(52474);var g=e.i(5232),v=e.i(89171),y=e.i(89228),R=e.i(50502);async function w(e){try{if(!await (0,R.getCurrentUser)())return v.NextResponse.json({error:"Unauthorized"},{status:401});let{careerGoalsText:t,existingProfile:r}=await e.json();if(!t||"string"!=typeof t)return v.NextResponse.json({error:"Career goals text is required"},{status:400});if(!process.env.OPENAI_API_KEY)return v.NextResponse.json({error:"OpenAI API key not configured"},{status:500});let a=new y.default({apiKey:process.env.OPENAI_API_KEY});console.log("[Parse Career Goals] Parsing career goals text with AI");let n=`You are an expert at extracting structured information from any kind of personal context dump.

EXISTING PROFILE DATA (DO NOT DUPLICATE):
${JSON.stringify(r,null,2)}

CONTEXT TEXT TO PARSE:
${t}

This text may be informal notes, ChatGPT memory exports, bullet points, casual writing, or any free-form dump of personal/professional context. Extract ALL relevant information NOT already in the existing profile. Be COMPREHENSIVE. Look for:

1. **Experiences**: Any mention of jobs, roles, internships, or work — even if briefly mentioned
2. **Leadership**: Founding companies, leading teams, managing people, club leadership, etc.
3. **Projects**: Products built, side projects, hackathons, research, coursework projects
4. **Skills**: Technical skills, tools, languages, frameworks, soft skills mentioned or implied
5. **Education**: Schools, degrees, programs, courses, bootcamps
6. **Certifications**: Any credentials, certificates, or professional qualifications
7. **Goals & Targets**: Stated target roles, industries, career aspirations, work style preferences

Return in this JSON format:

{
  "experiences": [
    {
      "role": "Job Title",
      "company": "Company Name",
      "dates": "Infer from context or use 'Present' if current, or leave empty if unknown",
      "bullets": [
        "Extract every achievement, responsibility, or detail mentioned",
        "Include metrics and numbers",
        "Capture the impact and scope"
      ]
    }
  ],
  "leadership": [
    {
      "role": "Leadership Role (e.g., Founder, Team Lead, President)",
      "company": "Organization or Company",
      "dates": "Infer or leave empty",
      "bullets": ["All leadership achievements and responsibilities"]
    }
  ],
  "projects": [
    {
      "title": "Project Name",
      "description": "Detailed description of what it is/does",
      "bullets": [
        "Key features, technologies, achievements",
        "Impact, users, metrics if mentioned"
      ]
    }
  ],
  "education": [
    {
      "degree": "Degree or Program",
      "school": "Institution Name",
      "year": "Year or 'Expected YYYY' or empty",
      "details": "GPA, honors, relevant details"
    }
  ],
  "skills": [
    "Extract ALL skills mentioned or strongly implied",
    "Include technical skills, tools, frameworks, languages",
    "Include soft skills like 'product thinking', 'user research', 'data analysis'",
    "Include domain expertise like 'fintech', 'AI/ML', 'sales'"
  ],
  "certifications": ["Any credentials or certifications mentioned"],
  "extractedGoals": "1-3 sentences summarizing ONLY the explicitly stated career goals, target roles, industries, or work preferences found in this text. Leave empty string if none are stated."
}

EXTRACTION RULES:
- Be AGGRESSIVE about extracting information — capture everything relevant
- Handle any format: bullet points, prose, memory exports, numbered lists, informal notes
- If something is mentioned even briefly, extract it with as much detail as possible
- Infer reasonable details from context (e.g., "I founded X" = leadership role)
- For skills, include both explicitly stated AND strongly implied skills
- Include metrics, numbers, and quantifiable achievements
- If dates aren’t mentioned, leave empty or infer from context clues
- Compare with existing profile to avoid exact duplicates, but extract if there are new details
- extractedGoals: ONLY state what is explicitly mentioned — do not invent or infer aspirations
- Return valid JSON only`,s=await a.chat.completions.create({model:"gpt-4o",messages:[{role:"system",content:"You are an expert at comprehensive information extraction. Be aggressive and thorough - extract ALL relevant details, achievements, skills, and experiences mentioned or implied in the text. Avoid duplicating existing profile data, but capture everything new. Return valid JSON only."},{role:"user",content:n}],temperature:.5,response_format:{type:"json_object"}}),i=JSON.parse(s.choices[0].message.content||"{}");return console.log("[Parse Career Goals] Extracted data keys:",Object.keys(i)),v.NextResponse.json({extractedData:i})}catch(e){return console.error("[Parse Career Goals] Error:",e),v.NextResponse.json({error:e instanceof Error?e.message:"Failed to parse career goals"},{status:500})}}e.s(["POST",()=>w,"runtime",0,"nodejs"],73967);var E=e.i(73967);let b=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/profile/parse-career-goals/route",pathname:"/api/profile/parse-career-goals",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/profile/parse-career-goals/route.ts",nextConfigOutput:"standalone",userland:E}),{workAsyncStorage:A,workUnitAsyncStorage:C,serverHooks:k}=b;function N(){return(0,a.patchFetch)({workAsyncStorage:A,workUnitAsyncStorage:C})}async function P(e,t,a){b.isDev&&(0,n.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let v="/api/profile/parse-career-goals/route";v=v.replace(/\/index$/,"")||"/";let y=await b.prepare(e,t,{srcPage:v,multiZoneDraftMode:!1});if(!y)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:R,params:w,nextConfig:E,parsedUrl:A,isDraftMode:C,prerenderManifest:k,routerServerContext:N,isOnDemandRevalidate:P,revalidateOnlyGenerated:I,resolvedPathname:T,clientReferenceManifest:O,serverActionsManifest:j}=y,S=(0,o.normalizeAppPath)(v),_=!!(k.dynamicRoutes[S]||k.routes[T]),q=async()=>((null==N?void 0:N.render404)?await N.render404(e,t,A,!1):t.end("This page could not be found"),null);if(_&&!C){let e=!!k.routes[T],t=k.dynamicRoutes[S];if(t&&!1===t.fallback&&!e){if(E.experimental.adapterPath)return await q();throw new x.NoFallbackError}}let U=null;!_||b.isDev||C||(U="/index"===(U=T)?"/":U);let L=!0===b.isDev||!_,D=_&&!L;j&&O&&(0,i.setManifestsSingleton)({page:v,clientReferenceManifest:O,serverActionsManifest:j});let H=e.method||"GET",G=(0,s.getTracer)(),M=G.getActiveScopeSpan(),F={params:w,prerenderManifest:k,renderOpts:{experimental:{authInterrupts:!!E.experimental.authInterrupts},cacheComponents:!!E.cacheComponents,supportsDynamicResponse:L,incrementalCache:(0,n.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:E.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,a,n)=>b.onRequestError(e,t,a,n,N)},sharedContext:{buildId:R}},K=new l.NodeNextRequest(e),Y=new l.NodeNextResponse(t),$=d.NextRequestAdapter.fromNodeNextRequest(K,(0,d.signalFromNodeResponse)(t));try{let i=async e=>b.handle($,F).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=G.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==c.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=r.get("next.route");if(a){let t=`${H} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t)}else e.updateName(`${H} ${v}`)}),o=!!(0,n.getRequestMeta)(e,"minimalMode"),l=async n=>{var s,l;let d=async({previousCacheEntry:r})=>{try{if(!o&&P&&I&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let s=await i(n);e.fetchMetrics=F.renderOpts.fetchMetrics;let l=F.renderOpts.pendingWaitUntil;l&&a.waitUntil&&(a.waitUntil(l),l=void 0);let d=F.renderOpts.collectedTags;if(!_)return await (0,p.sendResponse)(K,Y,s,F.renderOpts.pendingWaitUntil),null;{let e=await s.blob(),t=(0,m.toNodeOutgoingHttpHeaders)(s.headers);d&&(t[h.NEXT_CACHE_TAGS_HEADER]=d),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==F.renderOpts.collectedRevalidate&&!(F.renderOpts.collectedRevalidate>=h.INFINITE_CACHE)&&F.renderOpts.collectedRevalidate,a=void 0===F.renderOpts.collectedExpire||F.renderOpts.collectedExpire>=h.INFINITE_CACHE?void 0:F.renderOpts.collectedExpire;return{value:{kind:g.CachedRouteKind.APP_ROUTE,status:s.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:a}}}}catch(t){throw(null==r?void 0:r.isStale)&&await b.onRequestError(e,t,{routerKind:"App Router",routePath:v,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:D,isOnDemandRevalidate:P})},!1,N),t}},c=await b.handleResponse({req:e,nextConfig:E,cacheKey:U,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:k,isRoutePPREnabled:!1,isOnDemandRevalidate:P,revalidateOnlyGenerated:I,responseGenerator:d,waitUntil:a.waitUntil,isMinimalMode:o});if(!_)return null;if((null==c||null==(s=c.value)?void 0:s.kind)!==g.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==c||null==(l=c.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});o||t.setHeader("x-nextjs-cache",P?"REVALIDATED":c.isMiss?"MISS":c.isStale?"STALE":"HIT"),C&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let x=(0,m.fromNodeOutgoingHttpHeaders)(c.value.headers);return o&&_||x.delete(h.NEXT_CACHE_TAGS_HEADER),!c.cacheControl||t.getHeader("Cache-Control")||x.get("Cache-Control")||x.set("Cache-Control",(0,f.getCacheControlHeader)(c.cacheControl)),await (0,p.sendResponse)(K,Y,new Response(c.value.body,{headers:x,status:c.value.status||200})),null};M?await l(M):await G.withPropagatedContext(e.headers,()=>G.trace(c.BaseServerSpan.handleRequest,{spanName:`${H} ${v}`,kind:s.SpanKind.SERVER,attributes:{"http.method":H,"http.target":e.url}},l))}catch(t){if(t instanceof x.NoFallbackError||await b.onRequestError(e,t,{routerKind:"App Router",routePath:S,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:D,isOnDemandRevalidate:P})},!1,N),_)throw t;return await (0,p.sendResponse)(K,Y,new Response(null,{status:500})),null}}e.s(["handler",()=>P,"patchFetch",()=>N,"routeModule",()=>b,"serverHooks",()=>k,"workAsyncStorage",()=>A,"workUnitAsyncStorage",()=>C],71141)},19124,e=>{e.v(t=>Promise.all(["server/chunks/[root-of-the-server]__826cbbc8._.js"].map(t=>e.l(t))).then(()=>t(18870)))}];

//# sourceMappingURL=%5Broot-of-the-server%5D__3c0773f2._.js.map