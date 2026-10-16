"use client";

import Link from "next/link";
import Script from "next/script";

const VERSION = "5.17.14";

export default function ApiDocs() {
  return (
    <>
      <link rel="stylesheet" href={`https://cdn.jsdelivr.net/npm/swagger-ui-dist@${VERSION}/swagger-ui.css`} />
      <div className="bg-white px-6 py-3 text-sm">
        <Link href="/" className="text-primary hover:underline">Back to CampusFix</Link>
        <span className="ml-4 text-muted-foreground">
          Raw spec for Postman import: <a className="text-primary hover:underline" href="/api/docs">/api/docs</a>
        </span>
      </div>
      <div id="swagger" className="bg-white" />
      <Script
        src={`https://cdn.jsdelivr.net/npm/swagger-ui-dist@${VERSION}/swagger-ui-bundle.js`}
        strategy="afterInteractive"
        onReady={() => {
          (window as unknown as { SwaggerUIBundle: (o: object) => void }).SwaggerUIBundle({
            url: "/api/docs",
            dom_id: "#swagger",
          });
        }}
      />
    </>
  );
}
