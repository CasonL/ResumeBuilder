module.exports=[93695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},70406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},18622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},50502,e=>{"use strict";var t=e.i(26500);let r="casonlamothe@gmail.com";async function i(e,i){let s=await (0,t.createClient)(),{data:n}=await s.from("users").select("id").eq("id",e).single();n?i===r&&await s.from("users").update({is_admin:!0}).eq("id",e).eq("is_admin",!1):await s.from("users").insert({id:e,email:i,credits:3,is_admin:i===r})}async function s(){let e=await (0,t.createClient)(),{data:{user:r},error:i}=await e.auth.getUser();return i||!r?null:r}async function n(){let e=await s();if(!e)return null;await i(e.id,e.email||"");let r=await (0,t.createClient)(),{data:n,error:a}=await r.from("users").select("*").eq("id",e.id).single();return a||!n?null:{...e,...n}}async function a(){let e=await n();if(!e?.is_admin)throw Error("Admin privileges required");return e}e.s(["ensureUserExists",()=>i,"getCurrentUser",()=>s,"requireAdmin",()=>a])},24361,(e,t,r)=>{t.exports=e.x("util",()=>require("util"))},2157,(e,t,r)=>{t.exports=e.x("node:fs",()=>require("node:fs"))},81111,(e,t,r)=>{t.exports=e.x("node:stream",()=>require("node:stream"))},32457,e=>{"use strict";var t=e.i(47909),r=e.i(74017),i=e.i(96250),s=e.i(59756),n=e.i(61916),a=e.i(74677),o=e.i(69741),l=e.i(16795),u=e.i(87718),c=e.i(95169),d=e.i(47587),p=e.i(66012),h=e.i(70101),m=e.i(74838),g=e.i(10372),f=e.i(93695);e.i(52474);var w=e.i(5232),x=e.i(89171),y=e.i(89228),R=e.i(50502);let v=new y.default({apiKey:process.env.OPENAI_API_KEY});async function E(e){try{if(!await (0,R.getCurrentUser)())return x.NextResponse.json({error:"Authentication required"},{status:401});let{jobDescription:t,resumeContent:r,masterData:i}=await e.json();if(!process.env.OPENAI_API_KEY)return x.NextResponse.json({error:"OpenAI API key not configured"},{status:500});if(!t||!r||!i)return x.NextResponse.json({error:"Job description, resume content, and master data are required"},{status:400});let s=`You are a ruthless resume reviewer and editor. Your job is to make this resume maximally credible, specific, and outcome-driven for the target role.

JOB DESCRIPTION:
${t}

GENERATED RESUME CONTENT:
${JSON.stringify(r,null,2)}

USER'S MASTER DATA (full background):
${JSON.stringify(i,null,2)}

TASKS - EXECUTE IN ORDER:

A) SCAN DIAGNOSIS (Priority Issues)
Identify the highest-impact issues in this order:
1. **Role alignment and framing**: Does the top 1/3 (headline, summary, education focus) scream fit in 5 seconds?
2. **Proof of outcomes**: Where are results missing? (shipped deliverables, metrics, what changed)
3. **Decision-making + ownership**: Where do bullets describe activity but not judgment/tradeoffs?
4. **Product/process thinking**: Where are "insight → decision → execution → impact" loops absent?
5. **Specificity**: Where are nouns/verbs vague, generic, or clich\xe9?
6. **Credibility risks**: Anything that sounds inflated or unverifiable?

For each issue, cite the exact line/bullet and explain WHY it's weak.

B) TOP SECTION CRITIQUE
Evaluate:
- **Education Focus**: Does "${r.customizations?.educationFocus||"not set"}" immediately signal fit for this role?
- **First impression**: If recruiter scans top 1/3 for 5 seconds, what role do they think this is for?
- **Missing signal**: What's the strongest PM/role-specific hook that should be in the top section but isn't?

C) KEYWORD & SIGNAL EXTRACTION
From the job description, extract:
- **Top signals the resume currently communicates** (what a skim reader concludes in 8 seconds)
- **Top missing signals** (what a skim reader needs but won't infer)
- **Top 15 keywords/phrases** from job description that should appear naturally

D) SKILLS SECTION DIAGNOSIS
Current skills: ${JSON.stringify(r.selectedSkills)}

Critique:
- Are these skills **generic tool names** (Excel, PowerPoint, Teams) or **role-specific behaviors** (customer discovery, prioritization, experimentation)?
- Do they read like template filler or genuine competencies?
- What would make a recruiter think "this person can do THE JOB" not "this person can open software"?

E) BULLET-BY-BULLET CRITIQUE
For each major experience/leadership/project bullet, identify:
- **What's missing**: Outcome? Metric? Decision? Tradeoff? What shipped?
- **Weak verbs**: Generic action words that don't show ownership
- **Missed opportunity**: What could this bullet prove about the candidate that it currently doesn't?

F) ROLE-SPECIFIC FRAMING GAPS
Based on role type (PM/Sales/Eng/Ops), identify:
- Where technical/builder language should be reframed as product thinking
- Where activity should be reframed as decision-making
- Where generic "led/managed" should be role-specific "designed/shipped/optimized"

CRITICAL RULES:
- Be SPECIFIC. Don't say "add metrics" - say "PitchIQ bullet should include activation rate or weekly iteration cycles"
- Reference actual bullet points by experience ID and text
- Only suggest changes the master data supports
- Focus on FRAMING not FABRICATION
- Catch the "quiet killers": weak top section, generic skills, no proof of shipping/measuring/iterating

Return VALID JSON with this exact structure:
{
  "roleType": "string - detected role type",
  "overallAssessment": "string - 2-3 sentence summary: what's working, what's killing you",
  "topSectionIssues": {
    "educationFocusIssue": "string - what's wrong with current education focus line",
    "suggestedEducationFocus": "string - role-forward alternative",
    "firstImpressionProblem": "string - what role recruiter thinks this is for in first 5 seconds",
    "missingPMHook": "string - strongest signal that should be in top 1/3 but isn't"
  },
  "skillsSectionIssues": {
    "currentApproach": "string - why current skills are weak/generic",
    "suggestedSkills": ["array of 8-12 role-specific behavior phrases"],
    "rationale": "string - why these matter for this role"
  },
  "bulletCritiques": [
    {
      "experienceId": "string - ID from resumeContent",
      "currentBullet": "string - exact bullet text",
      "whatsMissing": "string - outcome/metric/decision/tradeoff/shipped deliverable",
      "weakVerbs": ["array of generic verbs used"],
      "suggestedRewrite": "string - specific stronger version with placeholders [X] if needed"
    }
  ],
  "missingProof": {
    "noShippedDeliverables": ["array of experiences where nothing shipped is mentioned"],
    "noMetrics": ["array of experiences missing any measurement"],
    "noDecisionMaking": ["array of bullets that describe activity but not judgment"],
    "noIterationLoop": ["array where insight→decision→execution→impact loop is absent"]
  },
  "framingGaps": [
    {
      "experienceId": "string",
      "currentFraming": "string - how it's framed now",
      "issue": "string - why this framing is wrong for the role",
      "roleSpecificReframe": "string - how to reframe for target role"
    }
  ],
  "quickWins": [
    "array of 3-5 highest-ROI changes ranked by impact"
  ]
}`,n=(await v.chat.completions.create({model:"gpt-4o",messages:[{role:"system",content:"You are an expert resume consultant who provides specific, actionable critique. Return valid JSON only."},{role:"user",content:s}],response_format:{type:"json_object"},temperature:.4})).choices[0].message.content;if(!n)throw Error("No response from OpenAI");let a=JSON.parse(n);return x.NextResponse.json({success:!0,critique:a})}catch(e){return console.error("Resume critique error:",e),x.NextResponse.json({error:"Failed to critique resume",details:e instanceof Error?e.message:"Unknown error"},{status:500})}}e.s(["POST",()=>E],28069);var b=e.i(28069);let C=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/critique-resume/route",pathname:"/api/critique-resume",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/critique-resume/route.ts",nextConfigOutput:"standalone",userland:b}),{workAsyncStorage:I,workUnitAsyncStorage:A,serverHooks:k}=C;function S(){return(0,i.patchFetch)({workAsyncStorage:I,workUnitAsyncStorage:A})}async function N(e,t,i){C.isDev&&(0,s.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let x="/api/critique-resume/route";x=x.replace(/\/index$/,"")||"/";let y=await C.prepare(e,t,{srcPage:x,multiZoneDraftMode:!1});if(!y)return t.statusCode=400,t.end("Bad Request"),null==i.waitUntil||i.waitUntil.call(i,Promise.resolve()),null;let{buildId:R,params:v,nextConfig:E,parsedUrl:b,isDraftMode:I,prerenderManifest:A,routerServerContext:k,isOnDemandRevalidate:S,revalidateOnlyGenerated:N,resolvedPathname:T,clientReferenceManifest:O,serverActionsManifest:P}=y,q=(0,o.normalizeAppPath)(x),j=!!(A.dynamicRoutes[q]||A.routes[T]),_=async()=>((null==k?void 0:k.render404)?await k.render404(e,t,b,!1):t.end("This page could not be found"),null);if(j&&!I){let e=!!A.routes[T],t=A.dynamicRoutes[q];if(t&&!1===t.fallback&&!e){if(E.experimental.adapterPath)return await _();throw new f.NoFallbackError}}let D=null;!j||C.isDev||I||(D="/index"===(D=T)?"/":D);let U=!0===C.isDev||!j,F=j&&!U;P&&O&&(0,a.setManifestsSingleton)({page:x,clientReferenceManifest:O,serverActionsManifest:P});let M=e.method||"GET",H=(0,n.getTracer)(),W=H.getActiveScopeSpan(),L={params:v,prerenderManifest:A,renderOpts:{experimental:{authInterrupts:!!E.experimental.authInterrupts},cacheComponents:!!E.cacheComponents,supportsDynamicResponse:U,incrementalCache:(0,s.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:E.cacheLife,waitUntil:i.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,i,s)=>C.onRequestError(e,t,i,s,k)},sharedContext:{buildId:R}},B=new l.NodeNextRequest(e),K=new l.NodeNextResponse(t),$=u.NextRequestAdapter.fromNodeNextRequest(B,(0,u.signalFromNodeResponse)(t));try{let a=async e=>C.handle($,L).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=H.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==c.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let i=r.get("next.route");if(i){let t=`${M} ${i}`;e.setAttributes({"next.route":i,"http.route":i,"next.span_name":t}),e.updateName(t)}else e.updateName(`${M} ${x}`)}),o=!!(0,s.getRequestMeta)(e,"minimalMode"),l=async s=>{var n,l;let u=async({previousCacheEntry:r})=>{try{if(!o&&S&&N&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let n=await a(s);e.fetchMetrics=L.renderOpts.fetchMetrics;let l=L.renderOpts.pendingWaitUntil;l&&i.waitUntil&&(i.waitUntil(l),l=void 0);let u=L.renderOpts.collectedTags;if(!j)return await (0,p.sendResponse)(B,K,n,L.renderOpts.pendingWaitUntil),null;{let e=await n.blob(),t=(0,h.toNodeOutgoingHttpHeaders)(n.headers);u&&(t[g.NEXT_CACHE_TAGS_HEADER]=u),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==L.renderOpts.collectedRevalidate&&!(L.renderOpts.collectedRevalidate>=g.INFINITE_CACHE)&&L.renderOpts.collectedRevalidate,i=void 0===L.renderOpts.collectedExpire||L.renderOpts.collectedExpire>=g.INFINITE_CACHE?void 0:L.renderOpts.collectedExpire;return{value:{kind:w.CachedRouteKind.APP_ROUTE,status:n.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:i}}}}catch(t){throw(null==r?void 0:r.isStale)&&await C.onRequestError(e,t,{routerKind:"App Router",routePath:x,routeType:"route",revalidateReason:(0,d.getRevalidateReason)({isStaticGeneration:F,isOnDemandRevalidate:S})},!1,k),t}},c=await C.handleResponse({req:e,nextConfig:E,cacheKey:D,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:A,isRoutePPREnabled:!1,isOnDemandRevalidate:S,revalidateOnlyGenerated:N,responseGenerator:u,waitUntil:i.waitUntil,isMinimalMode:o});if(!j)return null;if((null==c||null==(n=c.value)?void 0:n.kind)!==w.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==c||null==(l=c.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});o||t.setHeader("x-nextjs-cache",S?"REVALIDATED":c.isMiss?"MISS":c.isStale?"STALE":"HIT"),I&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let f=(0,h.fromNodeOutgoingHttpHeaders)(c.value.headers);return o&&j||f.delete(g.NEXT_CACHE_TAGS_HEADER),!c.cacheControl||t.getHeader("Cache-Control")||f.get("Cache-Control")||f.set("Cache-Control",(0,m.getCacheControlHeader)(c.cacheControl)),await (0,p.sendResponse)(B,K,new Response(c.value.body,{headers:f,status:c.value.status||200})),null};W?await l(W):await H.withPropagatedContext(e.headers,()=>H.trace(c.BaseServerSpan.handleRequest,{spanName:`${M} ${x}`,kind:n.SpanKind.SERVER,attributes:{"http.method":M,"http.target":e.url}},l))}catch(t){if(t instanceof f.NoFallbackError||await C.onRequestError(e,t,{routerKind:"App Router",routePath:q,routeType:"route",revalidateReason:(0,d.getRevalidateReason)({isStaticGeneration:F,isOnDemandRevalidate:S})},!1,k),j)throw t;return await (0,p.sendResponse)(B,K,new Response(null,{status:500})),null}}e.s(["handler",()=>N,"patchFetch",()=>S,"routeModule",()=>C,"serverHooks",()=>k,"workAsyncStorage",()=>I,"workUnitAsyncStorage",()=>A],32457)},19124,e=>{e.v(t=>Promise.all(["server/chunks/[root-of-the-server]__826cbbc8._.js"].map(t=>e.l(t))).then(()=>t(18870)))}];

//# sourceMappingURL=%5Broot-of-the-server%5D__2a8c832d._.js.map