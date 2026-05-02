(()=>{var a={};a.id=9217,a.ids=[9217],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},19121:a=>{"use strict";a.exports=require("next/dist/server/app-render/action-async-storage.external.js")},29294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},35552:(a,b,c)=>{"use strict";c.d(b,{A:()=>d});let d=(0,c(9608).lw)(process.env.DATABASE_URL)},44870:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},47867:(a,b,c)=>{"use strict";c.r(b),c.d(b,{handler:()=>G,patchFetch:()=>F,routeModule:()=>B,serverHooks:()=>E,workAsyncStorage:()=>C,workUnitAsyncStorage:()=>D});var d={};c.r(d),c.d(d,{DELETE:()=>A,GET:()=>x,PATCH:()=>z,POST:()=>y});var e=c(95736),f=c(9117),g=c(4044),h=c(39326),i=c(32324),j=c(261),k=c(54290),l=c(85328),m=c(38928),n=c(46595),o=c(3421),p=c(17679),q=c(41681),r=c(63446),s=c(86439),t=c(51356),u=c(10641),v=c(35552);function w(a){let b=a.approved?"approved":"pending";return{...a,product_name:a.product_name||"",customer_location:a.customer_location||"",review_text:a.comment||"",photo_url:a.photo_url||null,status:b}}async function x(a){try{let b=a.nextUrl.searchParams,c=b.get("status"),d=b.get("limit"),e=b.get("product_id"),f=d?Math.max(1,parseInt(d,10)||1):null,g=(e&&"approved"===c&&f?await (0,v.A)`
        SELECT r.*, p.name AS product_name
        FROM reviews r
        LEFT JOIN products p ON p.id = r.product_id
        WHERE r.product_id = ${e}::uuid AND r.approved = true
        ORDER BY r.created_at DESC
        LIMIT ${f}
      `:e&&"approved"===c?await (0,v.A)`
        SELECT r.*, p.name AS product_name
        FROM reviews r
        LEFT JOIN products p ON p.id = r.product_id
        WHERE r.product_id = ${e}::uuid AND r.approved = true
        ORDER BY r.created_at DESC
      `:e&&f?await (0,v.A)`
        SELECT r.*, p.name AS product_name
        FROM reviews r
        LEFT JOIN products p ON p.id = r.product_id
        WHERE r.product_id = ${e}::uuid
        ORDER BY r.created_at DESC
        LIMIT ${f}
      `:e?await (0,v.A)`
        SELECT r.*, p.name AS product_name
        FROM reviews r
        LEFT JOIN products p ON p.id = r.product_id
        WHERE r.product_id = ${e}::uuid
        ORDER BY r.created_at DESC
      `:"approved"===c&&f?await (0,v.A)`
        SELECT r.*, p.name AS product_name
        FROM reviews r
        LEFT JOIN products p ON p.id = r.product_id
        WHERE r.approved = true
        ORDER BY r.created_at DESC
        LIMIT ${f}
      `:"approved"===c?await (0,v.A)`
        SELECT r.*, p.name AS product_name
        FROM reviews r
        LEFT JOIN products p ON p.id = r.product_id
        WHERE r.approved = true
        ORDER BY r.created_at DESC
      `:f?await (0,v.A)`
        SELECT r.*, p.name AS product_name
        FROM reviews r
        LEFT JOIN products p ON p.id = r.product_id
        ORDER BY r.created_at DESC
        LIMIT ${f}
      `:await (0,v.A)`
        SELECT r.*, p.name AS product_name
        FROM reviews r
        LEFT JOIN products p ON p.id = r.product_id
        ORDER BY r.created_at DESC
      `).map(w);return c&&"approved"!==c&&(g=g.filter(a=>a.status===c)),u.NextResponse.json({reviews:g})}catch(a){return console.error("Reviews GET error:",a),u.NextResponse.json({error:"Failed to fetch reviews"},{status:500})}}async function y(a){try{let b=await a.json(),[c]=await (0,v.A)`
      INSERT INTO reviews (
        product_id, customer_name, phone, rating, comment, approved
      ) VALUES (
        ${b.product_id}::uuid,
        ${b.customer_name||b.name||""},
        ${b.phone??null},
        ${b.rating||5},
        ${b.comment||b.review_text||""},
        ${"approved"===b.status||!0===b.approved}
      )
      RETURNING *
    `;return u.NextResponse.json({review:w({...c,product_name:b.product_name||""})})}catch(a){return console.error("Reviews POST error:",a),u.NextResponse.json({error:"Failed to create review"},{status:500})}}async function z(a){try{let{id:b,...c}=await a.json();if(!b)return u.NextResponse.json({error:"Review ID required"},{status:400});let d=void 0!==c.status?"approved"===c.status:c.approved??null,[e]=await (0,v.A)`
      UPDATE reviews SET
        customer_name = COALESCE(${c.customer_name??null}, customer_name),
        phone = COALESCE(${c.phone??null}, phone),
        rating = COALESCE(${c.rating??null}, rating),
        comment = COALESCE(${c.comment??c.review_text??null}, comment),
        approved = COALESCE(${d}, approved)
      WHERE id = ${b}::uuid
      RETURNING *
    `;if(!e)return u.NextResponse.json({error:"Review not found"},{status:404});return u.NextResponse.json({review:w(e)})}catch(a){return console.error("Reviews PATCH error:",a),u.NextResponse.json({error:"Failed to update review"},{status:500})}}async function A(a){try{let b=a.nextUrl.searchParams.get("id");if(!b)return u.NextResponse.json({error:"Review ID required"},{status:400});let c=await (0,v.A)`DELETE FROM reviews WHERE id = ${b}::uuid RETURNING id`;if(0===c.length)return u.NextResponse.json({error:"Review not found"},{status:404});return u.NextResponse.json({success:!0})}catch(a){return console.error("Reviews DELETE error:",a),u.NextResponse.json({error:"Failed to delete review"},{status:500})}}let B=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/reviews/route",pathname:"/api/reviews",filename:"route",bundlePath:"app/api/reviews/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"C:\\Users\\SK\\Desktop\\flextreme\\src\\app\\api\\reviews\\route.ts",nextConfigOutput:"standalone",userland:d}),{workAsyncStorage:C,workUnitAsyncStorage:D,serverHooks:E}=B;function F(){return(0,g.patchFetch)({workAsyncStorage:C,workUnitAsyncStorage:D})}async function G(a,b,c){var d;let e="/api/reviews/route";"/index"===e&&(e="/");let g=await B.prepare(a,b,{srcPage:e,multiZoneDraftMode:!1});if(!g)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:u,params:v,nextConfig:w,isDraftMode:x,prerenderManifest:y,routerServerContext:z,isOnDemandRevalidate:A,revalidateOnlyGenerated:C,resolvedPathname:D}=g,E=(0,j.normalizeAppPath)(e),F=!!(y.dynamicRoutes[E]||y.routes[D]);if(F&&!x){let a=!!y.routes[D],b=y.dynamicRoutes[E];if(b&&!1===b.fallback&&!a)throw new s.NoFallbackError}let G=null;!F||B.isDev||x||(G="/index"===(G=D)?"/":G);let H=!0===B.isDev||!F,I=F&&!H,J=a.method||"GET",K=(0,i.getTracer)(),L=K.getActiveScopeSpan(),M={params:v,prerenderManifest:y,renderOpts:{experimental:{cacheComponents:!!w.experimental.cacheComponents,authInterrupts:!!w.experimental.authInterrupts},supportsDynamicResponse:H,incrementalCache:(0,h.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:null==(d=w.experimental)?void 0:d.cacheLife,isRevalidate:I,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d)=>B.onRequestError(a,b,d,z)},sharedContext:{buildId:u}},N=new k.NodeNextRequest(a),O=new k.NodeNextResponse(b),P=l.NextRequestAdapter.fromNodeNextRequest(N,(0,l.signalFromNodeResponse)(b));try{let d=async c=>B.handle(P,M).finally(()=>{if(!c)return;c.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let d=K.getRootSpanAttributes();if(!d)return;if(d.get("next.span_type")!==m.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${d.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=d.get("next.route");if(e){let a=`${J} ${e}`;c.setAttributes({"next.route":e,"http.route":e,"next.span_name":a}),c.updateName(a)}else c.updateName(`${J} ${a.url}`)}),g=async g=>{var i,j;let k=async({previousCacheEntry:f})=>{try{if(!(0,h.getRequestMeta)(a,"minimalMode")&&A&&C&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let e=await d(g);a.fetchMetrics=M.renderOpts.fetchMetrics;let i=M.renderOpts.pendingWaitUntil;i&&c.waitUntil&&(c.waitUntil(i),i=void 0);let j=M.renderOpts.collectedTags;if(!F)return await (0,o.I)(N,O,e,M.renderOpts.pendingWaitUntil),null;{let a=await e.blob(),b=(0,p.toNodeOutgoingHttpHeaders)(e.headers);j&&(b[r.NEXT_CACHE_TAGS_HEADER]=j),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==M.renderOpts.collectedRevalidate&&!(M.renderOpts.collectedRevalidate>=r.INFINITE_CACHE)&&M.renderOpts.collectedRevalidate,d=void 0===M.renderOpts.collectedExpire||M.renderOpts.collectedExpire>=r.INFINITE_CACHE?void 0:M.renderOpts.collectedExpire;return{value:{kind:t.CachedRouteKind.APP_ROUTE,status:e.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:d}}}}catch(b){throw(null==f?void 0:f.isStale)&&await B.onRequestError(a,b,{routerKind:"App Router",routePath:e,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:A})},z),b}},l=await B.handleResponse({req:a,nextConfig:w,cacheKey:G,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:y,isRoutePPREnabled:!1,isOnDemandRevalidate:A,revalidateOnlyGenerated:C,responseGenerator:k,waitUntil:c.waitUntil});if(!F)return null;if((null==l||null==(i=l.value)?void 0:i.kind)!==t.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==l||null==(j=l.value)?void 0:j.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});(0,h.getRequestMeta)(a,"minimalMode")||b.setHeader("x-nextjs-cache",A?"REVALIDATED":l.isMiss?"MISS":l.isStale?"STALE":"HIT"),x&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let m=(0,p.fromNodeOutgoingHttpHeaders)(l.value.headers);return(0,h.getRequestMeta)(a,"minimalMode")&&F||m.delete(r.NEXT_CACHE_TAGS_HEADER),!l.cacheControl||b.getHeader("Cache-Control")||m.get("Cache-Control")||m.set("Cache-Control",(0,q.getCacheControlHeader)(l.cacheControl)),await (0,o.I)(N,O,new Response(l.value.body,{headers:m,status:l.value.status||200})),null};L?await g(L):await K.withPropagatedContext(a.headers,()=>K.trace(m.BaseServerSpan.handleRequest,{spanName:`${J} ${a.url}`,kind:i.SpanKind.SERVER,attributes:{"http.method":J,"http.target":a.url}},g))}catch(b){if(b instanceof s.NoFallbackError||await B.onRequestError(a,b,{routerKind:"App Router",routePath:E,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:A})}),F)throw b;return await (0,o.I)(N,O,new Response(null,{status:500})),null}}},63033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},78335:()=>{},86439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},96487:()=>{}};var b=require("../../../webpack-runtime.js");b.C(a);var c=b.X(0,[5873,1692,9608],()=>b(b.s=47867));module.exports=c})();