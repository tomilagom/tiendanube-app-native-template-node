import { Request, Response, NextFunction } from "express";
import { userRepository } from "@repository";
import { tiendanubeApiClient } from "@config";
import { TiendanubeAuthInterface } from "@features/auth";

const CONFIG_SCRIPT_HANDLE = "customerio-connect-pixel";

export const getConfig = (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as TiendanubeAuthInterface;
    
    if (!user) {
        throw new Error("User not found in request context");
    }

    res.json({
        cdp_write_key: user.cdp_write_key,
        region_center: user.region_center,
        custom_proxy_domain: user.custom_proxy_domain,
    });
  } catch (error) {
    next(error);
  }
};

export const updateConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { cdp_write_key, region_center, custom_proxy_domain } = req.body;
        const user = req.user as TiendanubeAuthInterface;

        if (!user) {
            throw new Error("User not found in request context");
        }

        const userId = user.user_id;

        // Update local DB
        const updatedUser: TiendanubeAuthInterface = {
            ...user,
            cdp_write_key,
            region_center,
            custom_proxy_domain
        };
        userRepository.save(updatedUser);

        // Generate Script Content
        const baseUrl = custom_proxy_domain || (region_center === 'EU' ? 'https://cdp-eu.customer.io' : 'https://cdp.customer.io');
        
        // This is a simplified snippet. In production, this should be the full analytics.js snippet.
        // For the purpose of this template, we'll assume a basic loader.
        const scriptContent = `
            !function(){var analytics=window.analytics=window.analytics||[];if(!analytics.initialize)if(analytics.invoked)window.console&&console.error&&console.error("Segment snippet included twice.");else{analytics.invoked=!0;analytics.methods=["trackSubmit","trackClick","trackLink","trackForm","pageview","identify","reset","group","track","ready","alias","debug","page","once","off","on","addSourceMiddleware","addIntegrationMiddleware","setAnonymousId","addDestinationMiddleware"];analytics.factory=function(e){return function(){var t=Array.prototype.slice.call(arguments);t.unshift(e);analytics.push(t);return analytics}};for(var e=0;e<analytics.methods.length;e++){var key=analytics.methods[e];analytics[key]=analytics.factory(key)}analytics.load=function(key,e){var t=document.createElement("script");t.type="text/javascript";t.async=!0;t.src="https://cdp.customer.io/v1/analytics-js/snippet/" + key + "/analytics.min.js";var n=document.getElementsByTagName("script")[0];n.parentNode.insertBefore(t,n);analytics._loadOptions=e};analytics._writeKey="${cdp_write_key}";;analytics.SNIPPET_VERSION="4.15.3";
            analytics.load("${cdp_write_key}");
            analytics.page();
            }}();
        `;

        // Tiendanube Scripts API
        // First check if script exists (optional, or just try to create/update)
        // Since Tiendanube API doesn't have "createOrUpdate" easily without ID, 
        // we might delete and recreate or just create.
        // But to keep it simple and stateless (we don't store script_id), let's try to list scripts first maybe?
        // Or simply POST and ignore if it duplicates? Duplication is bad. 
        // Better: List scripts, find by handle/name (if supported) or just by content?
        // Tiendanube Scripts don't have "handle" field publicly visible usually like Shopify.
        // But we can filter. 
        
        // Let's assume we fetch all scripts and check if one contains our simple signature.
        // GET /v1/{store_id}/scripts
        const scripts = await tiendanubeApiClient.get(`/${userId}/v1/scripts`);
        const existingScript = (scripts as unknown as any[]).find((s: any) => s.src.includes('cdp.customer.io') || s.content?.includes('analytics.load'));

        if (existingScript) {
             await tiendanubeApiClient.put(`/${userId}/v1/scripts/${existingScript.id}`, {
                name: 'Customer.io Pixel',
                event: 'onload',
                content: scriptContent
             });
        } else {
             await tiendanubeApiClient.post(`/${userId}/v1/scripts`, {
                name: 'Customer.io Pixel',
                event: 'onload',
                content: scriptContent
             });
        }

        res.json({ success: true });
    } catch (error) {
        next(error);
    }
}
