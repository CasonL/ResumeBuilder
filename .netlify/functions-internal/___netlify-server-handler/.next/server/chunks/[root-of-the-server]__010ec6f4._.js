module.exports=[93695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},70406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},18622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},50502,e=>{"use strict";var t=e.i(26500);let r="casonlamothe@gmail.com";async function a(e,a){let s=await (0,t.createClient)(),{data:n}=await s.from("users").select("id").eq("id",e).single();n?a===r&&await s.from("users").update({is_admin:!0}).eq("id",e).eq("is_admin",!1):await s.from("users").insert({id:e,email:a,credits:3,is_admin:a===r})}async function s(){let e=await (0,t.createClient)(),{data:{user:r},error:a}=await e.auth.getUser();return a||!r?null:r}async function n(){let e=await s();if(!e)return null;await a(e.id,e.email||"");let r=await (0,t.createClient)(),{data:n,error:i}=await r.from("users").select("*").eq("id",e.id).single();return i||!n?null:{...e,...n}}async function i(){let e=await n();if(!e?.is_admin)throw Error("Admin privileges required");return e}e.s(["ensureUserExists",()=>a,"getCurrentUser",()=>s,"requireAdmin",()=>i])},24361,(e,t,r)=>{t.exports=e.x("util",()=>require("util"))},2157,(e,t,r)=>{t.exports=e.x("node:fs",()=>require("node:fs"))},81111,(e,t,r)=>{t.exports=e.x("node:stream",()=>require("node:stream"))},70833,e=>{"use strict";var t=e.i(47909),r=e.i(74017),a=e.i(96250),s=e.i(59756),n=e.i(61916),i=e.i(74677),o=e.i(69741),l=e.i(16795),c=e.i(87718),d=e.i(95169),u=e.i(47587),p=e.i(66012),g=e.i(70101),h=e.i(74838),m=e.i(10372),f=e.i(93695);e.i(52474);var y=e.i(5232),x=e.i(89171),v=e.i(89228),R=e.i(50502);let w=new v.default({apiKey:process.env.OPENAI_API_KEY});async function A(e){try{if(!await (0,R.getCurrentUser)())return x.NextResponse.json({error:"Authentication required"},{status:401});let{profileData:t}=await e.json();if(!process.env.OPENAI_API_KEY)return x.NextResponse.json({error:"OpenAI API key not configured"},{status:500});if(!t)return x.NextResponse.json({error:"Profile data is required"},{status:400});let r=`Analyze this candidate's profile and generate a comprehensive, well-organized skills section.

CANDIDATE PROFILE:
${JSON.stringify(t,null,2)}

Generate a skills section with 3-5 relevant categories. Each category should group related skills together.

INSTRUCTIONS:
1. Review ALL experiences, projects, and leadership roles
2. Extract both explicit skills (mentioned directly) and implicit skills (demonstrated through work)
3. Organize skills into logical, role-relevant categories
4. Use descriptive category names that help with scanning (e.g., "Product + Strategy", "Technical Tools", "Finance + Analysis")
5. Include 3-6 specific skills per category
6. Prioritize concrete, demonstrable skills over generic soft skills
7. Avoid generic skills like "Communication", "Problem Solving", "Teamwork" unless they're highly specific

CATEGORY NAMING EXAMPLES:
- "Product + Strategy" (for PM/product roles)
- "Customer + Sales" (for client-facing roles)
- "Finance + Analysis" (for finance/analytical roles)
- "Technical Tools" (for software/tools)
- "Data + Analytics" (for data-focused skills)
- "Operations + Process" (for operational skills)
- "Leadership + Management" (for management skills)

SKILL EXTRACTION RULES:
- Technical tools/software → "Technical Tools" category
- Product/strategy work → "Product + Strategy" category
- Customer/sales work → "Customer + Sales" category
- Financial analysis → "Finance + Analysis" category
- Data work → "Data + Analytics" category
- Process improvement → "Operations + Process" category

Return VALID JSON with this structure:
{
  "skills": [
    {
      "category": "string - descriptive category name",
      "items": ["array of 3-6 specific skills in this category"]
    }
  ],
  "reasoning": "Brief explanation of why these categories and skills were selected"
}

EXAMPLES:

For a PM/Product candidate:
{
  "skills": [
    {
      "category": "Product + Strategy",
      "items": ["Customer Discovery", "Feature Prioritization", "Product Roadmapping", "User Research", "Market Analysis"]
    },
    {
      "category": "Technical Tools",
      "items": ["Figma", "Jira", "SQL", "Excel", "Google Analytics"]
    },
    {
      "category": "Data + Analytics",
      "items": ["A/B Testing", "Metrics Definition", "Data-Driven Decision Making", "User Behavior Analysis"]
    }
  ]
}

For a Finance candidate:
{
  "skills": [
    {
      "category": "Finance + Analysis",
      "items": ["Financial Modeling", "Risk Assessment", "Credit Evaluation", "Budget Management", "Variance Analysis"]
    },
    {
      "category": "Technical Tools",
      "items": ["Excel", "Bloomberg Terminal", "SAP", "Power BI", "SQL"]
    },
    {
      "category": "Operations + Process",
      "items": ["Process Optimization", "Compliance Management", "Audit Coordination", "Reporting"]
    }
  ]
}

Be thorough and strategic. Extract skills that demonstrate real capabilities.`,a=(await w.chat.completions.create({model:"gpt-4o",messages:[{role:"system",content:"You are a career consultant specializing in skills assessment. Extract and organize skills from candidate profiles. Return valid JSON only."},{role:"user",content:r}],response_format:{type:"json_object"},temperature:.3})).choices[0].message.content;if(!a)throw Error("No response from OpenAI");let s=JSON.parse(a);return x.NextResponse.json(s)}catch(e){return console.error("Skill generation error:",e),x.NextResponse.json({error:"Failed to generate skills"},{status:500})}}e.s(["POST",()=>A],93753);var E=e.i(93753);let k=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/profile/generate-skills/route",pathname:"/api/profile/generate-skills",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/profile/generate-skills/route.ts",nextConfigOutput:"standalone",userland:E}),{workAsyncStorage:P,workUnitAsyncStorage:C,serverHooks:T}=k;function N(){return(0,a.patchFetch)({workAsyncStorage:P,workUnitAsyncStorage:C})}async function S(e,t,a){k.isDev&&(0,s.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let x="/api/profile/generate-skills/route";x=x.replace(/\/index$/,"")||"/";let v=await k.prepare(e,t,{srcPage:x,multiZoneDraftMode:!1});if(!v)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:R,params:w,nextConfig:A,parsedUrl:E,isDraftMode:P,prerenderManifest:C,routerServerContext:T,isOnDemandRevalidate:N,revalidateOnlyGenerated:S,resolvedPathname:O,clientReferenceManifest:b,serverActionsManifest:_}=v,I=(0,o.normalizeAppPath)(x),q=!!(C.dynamicRoutes[I]||C.routes[O]),j=async()=>((null==T?void 0:T.render404)?await T.render404(e,t,E,!1):t.end("This page could not be found"),null);if(q&&!P){let e=!!C.routes[O],t=C.dynamicRoutes[I];if(t&&!1===t.fallback&&!e){if(A.experimental.adapterPath)return await j();throw new f.NoFallbackError}}let D=null;!q||k.isDev||P||(D="/index"===(D=O)?"/":D);let U=!0===k.isDev||!q,M=q&&!U;_&&b&&(0,i.setManifestsSingleton)({page:x,clientReferenceManifest:b,serverActionsManifest:_});let F=e.method||"GET",H=(0,n.getTracer)(),L=H.getActiveScopeSpan(),B={params:w,prerenderManifest:C,renderOpts:{experimental:{authInterrupts:!!A.experimental.authInterrupts},cacheComponents:!!A.cacheComponents,supportsDynamicResponse:U,incrementalCache:(0,s.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:A.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,a,s)=>k.onRequestError(e,t,a,s,T)},sharedContext:{buildId:R}},K=new l.NodeNextRequest(e),$=new l.NodeNextResponse(t),z=c.NextRequestAdapter.fromNodeNextRequest(K,(0,c.signalFromNodeResponse)(t));try{let i=async e=>k.handle(z,B).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=H.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==d.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=r.get("next.route");if(a){let t=`${F} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t)}else e.updateName(`${F} ${x}`)}),o=!!(0,s.getRequestMeta)(e,"minimalMode"),l=async s=>{var n,l;let c=async({previousCacheEntry:r})=>{try{if(!o&&N&&S&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let n=await i(s);e.fetchMetrics=B.renderOpts.fetchMetrics;let l=B.renderOpts.pendingWaitUntil;l&&a.waitUntil&&(a.waitUntil(l),l=void 0);let c=B.renderOpts.collectedTags;if(!q)return await (0,p.sendResponse)(K,$,n,B.renderOpts.pendingWaitUntil),null;{let e=await n.blob(),t=(0,g.toNodeOutgoingHttpHeaders)(n.headers);c&&(t[m.NEXT_CACHE_TAGS_HEADER]=c),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==B.renderOpts.collectedRevalidate&&!(B.renderOpts.collectedRevalidate>=m.INFINITE_CACHE)&&B.renderOpts.collectedRevalidate,a=void 0===B.renderOpts.collectedExpire||B.renderOpts.collectedExpire>=m.INFINITE_CACHE?void 0:B.renderOpts.collectedExpire;return{value:{kind:y.CachedRouteKind.APP_ROUTE,status:n.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:a}}}}catch(t){throw(null==r?void 0:r.isStale)&&await k.onRequestError(e,t,{routerKind:"App Router",routePath:x,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:M,isOnDemandRevalidate:N})},!1,T),t}},d=await k.handleResponse({req:e,nextConfig:A,cacheKey:D,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:C,isRoutePPREnabled:!1,isOnDemandRevalidate:N,revalidateOnlyGenerated:S,responseGenerator:c,waitUntil:a.waitUntil,isMinimalMode:o});if(!q)return null;if((null==d||null==(n=d.value)?void 0:n.kind)!==y.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==d||null==(l=d.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});o||t.setHeader("x-nextjs-cache",N?"REVALIDATED":d.isMiss?"MISS":d.isStale?"STALE":"HIT"),P&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let f=(0,g.fromNodeOutgoingHttpHeaders)(d.value.headers);return o&&q||f.delete(m.NEXT_CACHE_TAGS_HEADER),!d.cacheControl||t.getHeader("Cache-Control")||f.get("Cache-Control")||f.set("Cache-Control",(0,h.getCacheControlHeader)(d.cacheControl)),await (0,p.sendResponse)(K,$,new Response(d.value.body,{headers:f,status:d.value.status||200})),null};L?await l(L):await H.withPropagatedContext(e.headers,()=>H.trace(d.BaseServerSpan.handleRequest,{spanName:`${F} ${x}`,kind:n.SpanKind.SERVER,attributes:{"http.method":F,"http.target":e.url}},l))}catch(t){if(t instanceof f.NoFallbackError||await k.onRequestError(e,t,{routerKind:"App Router",routePath:I,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:M,isOnDemandRevalidate:N})},!1,T),q)throw t;return await (0,p.sendResponse)(K,$,new Response(null,{status:500})),null}}e.s(["handler",()=>S,"patchFetch",()=>N,"routeModule",()=>k,"serverHooks",()=>T,"workAsyncStorage",()=>P,"workUnitAsyncStorage",()=>C],70833)},19124,e=>{e.v(t=>Promise.all(["server/chunks/[root-of-the-server]__826cbbc8._.js"].map(t=>e.l(t))).then(()=>t(18870)))}];

//# sourceMappingURL=%5Broot-of-the-server%5D__010ec6f4._.js.map