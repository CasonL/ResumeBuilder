module.exports=[93695,(e,t,a)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},70406,(e,t,a)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},18622,(e,t,a)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},56704,(e,t,a)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},32319,(e,t,a)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},24725,(e,t,a)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},61815,e=>{"use strict";var t=e.i(47909),a=e.i(74017),n=e.i(96250),r=e.i(59756),i=e.i(61916),o=e.i(74677),l=e.i(69741),s=e.i(16795),d=e.i(87718),p=e.i(95169),u=e.i(47587),c=e.i(66012),h=e.i(70101),g=e.i(74838),m=e.i(10372),x=e.i(93695);e.i(52474);var f=e.i(5232),b=e.i(89171);class R{pageHeight=1056;targetPages;constructor(e=1){this.targetPages=e}calculateElementHeight(e,t,a=0,n=0,r=0,i=0){return e*t+a+n+r+i}countElements(e){return null}measureInPrintMode(e){return{headerHeight:200,totalHeight:1e3}}calculateTotalHeight(e,t,a){let n;n=0+(t.margin.topPadding+t.margin.bottomPadding)+(a?.headerHeight||200)+e.h2Sections*this.calculateElementHeight(t.fontSize.h2,1,t.margin.h2.top,t.margin.h2.bottom)+e.bulletPoints*this.calculateElementHeight(t.fontSize.bullet,t.lineHeight.bullet,t.margin.bullet.top,t.margin.bullet.bottom)+e.roleHeaders*(14+t.margin.role.bottom);let r=t.fontSize.chip+2*t.padding.chip.vertical,i=Math.ceil(e.skillChips/4);return n+=i*r+(i-1)*5,n+=this.calculateElementHeight(t.fontSize.small,1,t.margin.footer.top,0,t.margin.footer.topPadding,0),n+=(e.h2Sections-1)*t.margin.aside.h2}optimizeSpacing(e,t){let a=this.targetPages*this.pageHeight;if(t&&t.totalHeight>0){let e=Math.min(.98,a/t.totalHeight);return{fontSize:{name:Math.round(24*e*10)/10,tagline:Math.round(12*e*10)/10,h2:Math.round(11*e*10)/10,bullet:Math.round(12*e*10)/10,chip:Math.round(11*e*10)/10,small:Math.round(11*e*10)/10},lineHeight:{tagline:Math.max(1.2,1.3*e),bullet:Math.max(1.2,1.35*e)},margin:{topPadding:Math.round(24*e),bottomPadding:Math.round(24*e),topSection:{bottom:Math.round(10*e),top:0},h2:{top:Math.round(12*e),bottom:Math.round(6*e)},bullet:{top:Math.round(3*e),bottom:Math.round(3*e)},role:{bottom:Math.round(12*e)},aside:{h2:Math.round(12*e)},footer:{top:Math.round(10*e),topPadding:Math.round(6*e)}},padding:{chip:{vertical:Math.round(3*e),horizontal:7}}}}let n={fontSize:{name:24,tagline:12,h2:11,bullet:12,chip:11,small:11},lineHeight:{tagline:1.3,bullet:1.35},margin:{topPadding:24,bottomPadding:24,topSection:{bottom:10,top:0},h2:{top:12,bottom:6},bullet:{top:3,bottom:3},role:{bottom:12},aside:{h2:12},footer:{top:10,topPadding:6}},padding:{chip:{vertical:3,horizontal:7}}},r=this.calculateTotalHeight(e,n,t);if(r>a){let e=(a-50)/r;n.margin.topPadding*=e,n.margin.bottomPadding*=e,n.margin.h2.top*=e,n.margin.h2.bottom*=e,n.margin.bullet.top*=e,n.margin.bullet.bottom*=e,n.margin.role.bottom*=e,n.margin.aside.h2*=e,n.fontSize.bullet*=Math.max(.95,e),n.lineHeight.bullet=Math.max(1.2,n.lineHeight.bullet*e)}if(r<a-50&&2===this.targetPages){let e=(a-50)/r;n.margin.h2.top*=e,n.margin.h2.bottom*=e,n.margin.bullet.top*=e,n.margin.bullet.bottom*=e,n.lineHeight.bullet=Math.min(1.6,n.lineHeight.bullet*e)}return Object.keys(n.fontSize).forEach(e=>{n.fontSize[e]=Math.round(100*n.fontSize[e])/100}),n}generateCSS(e){return`
.resume {
  padding: ${e.margin.topPadding}px ${1.2*e.margin.topPadding}px;
}

.name {
  font-size: ${e.fontSize.name}px;
}

.tagline {
  font-size: ${e.fontSize.tagline}px;
  line-height: ${e.lineHeight.tagline};
  margin-top: 4px;
}

.top {
  padding-bottom: ${e.margin.topSection.bottom}px;
  margin-bottom: ${e.margin.topSection.bottom}px;
}

h2 {
  font-size: ${e.fontSize.h2}px;
  margin: ${e.margin.h2.top}px 0 ${e.margin.h2.bottom}px;
}

li {
  font-size: ${e.fontSize.bullet}px;
  line-height: ${e.lineHeight.bullet};
  margin: ${e.margin.bullet.top}px 0;
}

.role {
  margin-bottom: ${e.margin.role.bottom}px;
}

.chip {
  font-size: ${e.fontSize.chip}px;
  padding: ${e.padding.chip.vertical}px ${e.padding.chip.horizontal}px;
}

.small {
  font-size: ${e.fontSize.small}px;
}

aside h2:not(:first-of-type) {
  margin-top: ${e.margin.aside.h2}px;
}

.foot {
  margin-top: ${e.margin.footer.top}px;
  padding-top: ${e.margin.footer.topPadding}px;
}

@media print {
  .resume {
    padding: ${e.margin.topPadding/96*2.54}cm ${1.2*e.margin.topPadding/96*2.54}cm;
  }
}
    `.trim()}analyze(e){let t=this.countElements(e);if(!t)return null;let a=this.measureInPrintMode(e),n=this.optimizeSpacing(t,a),r=this.calculateTotalHeight(t,n,a),i=this.targetPages*this.pageHeight,o=a.totalHeight>0?i/a.totalHeight:1;return{elements:t,optimalConfig:n,estimatedHeight:r,targetHeight:i,css:this.generateCSS(n),actualHeaderHeight:a.headerHeight,actualTotalHeight:a.totalHeight,scaleFactor:o}}}async function v(e){try{let{elements:t,targetPages:a}=await e.json();if(!t||!a)return b.NextResponse.json({error:"Missing elements or targetPages"},{status:400});let n=new R(a),r=n.optimizeSpacing(t),i=n.calculateTotalHeight(t,r),o=1056*a,l=n.generateCSS(r);return b.NextResponse.json({success:!0,optimalConfig:r,estimatedHeight:i,targetHeight:o,fitPercentage:i/o*100,css:l,elements:t})}catch(e){return console.error("Calculate fit error:",e),b.NextResponse.json({error:e.message||"Failed to calculate fit"},{status:500})}}e.s(["POST",()=>v],82682);var S=e.i(82682);let H=new t.AppRouteRouteModule({definition:{kind:a.RouteKind.APP_ROUTE,page:"/api/calculate-fit/route",pathname:"/api/calculate-fit",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/calculate-fit/route.ts",nextConfigOutput:"standalone",userland:S}),{workAsyncStorage:P,workUnitAsyncStorage:E,serverHooks:w}=H;function M(){return(0,n.patchFetch)({workAsyncStorage:P,workUnitAsyncStorage:E})}async function C(e,t,n){H.isDev&&(0,r.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let b="/api/calculate-fit/route";b=b.replace(/\/index$/,"")||"/";let R=await H.prepare(e,t,{srcPage:b,multiZoneDraftMode:!1});if(!R)return t.statusCode=400,t.end("Bad Request"),null==n.waitUntil||n.waitUntil.call(n,Promise.resolve()),null;let{buildId:v,params:S,nextConfig:P,parsedUrl:E,isDraftMode:w,prerenderManifest:M,routerServerContext:C,isOnDemandRevalidate:y,revalidateOnlyGenerated:$,resolvedPathname:z,clientReferenceManifest:T,serverActionsManifest:A}=R,N=(0,l.normalizeAppPath)(b),k=!!(M.dynamicRoutes[N]||M.routes[z]),O=async()=>((null==C?void 0:C.render404)?await C.render404(e,t,E,!1):t.end("This page could not be found"),null);if(k&&!w){let e=!!M.routes[z],t=M.dynamicRoutes[N];if(t&&!1===t.fallback&&!e){if(P.experimental.adapterPath)return await O();throw new x.NoFallbackError}}let j=null;!k||H.isDev||w||(j="/index"===(j=z)?"/":j);let q=!0===H.isDev||!k,_=k&&!q;A&&T&&(0,o.setManifestsSingleton)({page:b,clientReferenceManifest:T,serverActionsManifest:A});let I=e.method||"GET",U=(0,i.getTracer)(),D=U.getActiveScopeSpan(),F={params:S,prerenderManifest:M,renderOpts:{experimental:{authInterrupts:!!P.experimental.authInterrupts},cacheComponents:!!P.cacheComponents,supportsDynamicResponse:q,incrementalCache:(0,r.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:P.cacheLife,waitUntil:n.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,a,n,r)=>H.onRequestError(e,t,n,r,C)},sharedContext:{buildId:v}},K=new s.NodeNextRequest(e),B=new s.NodeNextResponse(t),L=d.NextRequestAdapter.fromNodeNextRequest(K,(0,d.signalFromNodeResponse)(t));try{let o=async e=>H.handle(L,F).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let a=U.getRootSpanAttributes();if(!a)return;if(a.get("next.span_type")!==p.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${a.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let n=a.get("next.route");if(n){let t=`${I} ${n}`;e.setAttributes({"next.route":n,"http.route":n,"next.span_name":t}),e.updateName(t)}else e.updateName(`${I} ${b}`)}),l=!!(0,r.getRequestMeta)(e,"minimalMode"),s=async r=>{var i,s;let d=async({previousCacheEntry:a})=>{try{if(!l&&y&&$&&!a)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let i=await o(r);e.fetchMetrics=F.renderOpts.fetchMetrics;let s=F.renderOpts.pendingWaitUntil;s&&n.waitUntil&&(n.waitUntil(s),s=void 0);let d=F.renderOpts.collectedTags;if(!k)return await (0,c.sendResponse)(K,B,i,F.renderOpts.pendingWaitUntil),null;{let e=await i.blob(),t=(0,h.toNodeOutgoingHttpHeaders)(i.headers);d&&(t[m.NEXT_CACHE_TAGS_HEADER]=d),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let a=void 0!==F.renderOpts.collectedRevalidate&&!(F.renderOpts.collectedRevalidate>=m.INFINITE_CACHE)&&F.renderOpts.collectedRevalidate,n=void 0===F.renderOpts.collectedExpire||F.renderOpts.collectedExpire>=m.INFINITE_CACHE?void 0:F.renderOpts.collectedExpire;return{value:{kind:f.CachedRouteKind.APP_ROUTE,status:i.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:a,expire:n}}}}catch(t){throw(null==a?void 0:a.isStale)&&await H.onRequestError(e,t,{routerKind:"App Router",routePath:b,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:_,isOnDemandRevalidate:y})},!1,C),t}},p=await H.handleResponse({req:e,nextConfig:P,cacheKey:j,routeKind:a.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:M,isRoutePPREnabled:!1,isOnDemandRevalidate:y,revalidateOnlyGenerated:$,responseGenerator:d,waitUntil:n.waitUntil,isMinimalMode:l});if(!k)return null;if((null==p||null==(i=p.value)?void 0:i.kind)!==f.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==p||null==(s=p.value)?void 0:s.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});l||t.setHeader("x-nextjs-cache",y?"REVALIDATED":p.isMiss?"MISS":p.isStale?"STALE":"HIT"),w&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let x=(0,h.fromNodeOutgoingHttpHeaders)(p.value.headers);return l&&k||x.delete(m.NEXT_CACHE_TAGS_HEADER),!p.cacheControl||t.getHeader("Cache-Control")||x.get("Cache-Control")||x.set("Cache-Control",(0,g.getCacheControlHeader)(p.cacheControl)),await (0,c.sendResponse)(K,B,new Response(p.value.body,{headers:x,status:p.value.status||200})),null};D?await s(D):await U.withPropagatedContext(e.headers,()=>U.trace(p.BaseServerSpan.handleRequest,{spanName:`${I} ${b}`,kind:i.SpanKind.SERVER,attributes:{"http.method":I,"http.target":e.url}},s))}catch(t){if(t instanceof x.NoFallbackError||await H.onRequestError(e,t,{routerKind:"App Router",routePath:N,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:_,isOnDemandRevalidate:y})},!1,C),k)throw t;return await (0,c.sendResponse)(K,B,new Response(null,{status:500})),null}}e.s(["handler",()=>C,"patchFetch",()=>M,"routeModule",()=>H,"serverHooks",()=>w,"workAsyncStorage",()=>P,"workUnitAsyncStorage",()=>E],61815)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__feab7076._.js.map