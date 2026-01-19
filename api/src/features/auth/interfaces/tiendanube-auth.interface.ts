export interface TiendanubeAuthInterface {
  access_token?: string;
  token_type?: string;
  scope?: string;
  user_id?: number;
  error?: string;
  error_description?: string;
  cdp_write_key?: string;
  region_center?: 'US' | 'EU';
  custom_proxy_domain?: string;
}
