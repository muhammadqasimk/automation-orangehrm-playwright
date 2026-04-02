import { Page, Request, Response } from '@playwright/test';

/**
 * ApiHelper — intercepts network requests during UI actions
 * to assert HTTP methods and status codes.
 *
 * Directly automates:
 *   TC-EMP-028  (Add Employee must use POST → 201)
 *   TC-EMP-029  (Delete Employee must use DELETE → 204)
 *   TC-LOG-024  (Failed login must return 401 not 302)
 */
export class ApiHelper {
  constructor(private readonly page: Page) {}

  /**
   * Captures the first request whose URL matches the predicate,
   * triggered by executing the provided action.
   */
  async captureRequest(
    urlPattern: string | RegExp,
    action: () => Promise<void>
  ): Promise<Request> {
    const [request] = await Promise.all([
      this.page.waitForRequest(
        req => typeof urlPattern === 'string'
          ? req.url().includes(urlPattern)
          : urlPattern.test(req.url())
      ),
      action(),
    ]);
    return request;
  }

  /**
   * Captures the first response whose URL matches the predicate,
   * triggered by executing the provided action.
   */
  async captureResponse(
    urlPattern: string | RegExp,
    action: () => Promise<void>
  ): Promise<Response> {
    const [response] = await Promise.all([
      this.page.waitForResponse(
        res => typeof urlPattern === 'string'
          ? res.url().includes(urlPattern)
          : urlPattern.test(res.url())
      ),
      action(),
    ]);
    return response;
  }

  /**
   * Captures both the request and response simultaneously.
   * Useful when you need to assert both method and status code.
   */
  async captureRequestAndResponse(
    urlPattern: string | RegExp,
    action: () => Promise<void>
  ): Promise<{ request: Request; response: Response }> {
    const [response] = await Promise.all([
      this.page.waitForResponse(
        res => typeof urlPattern === 'string'
          ? res.url().includes(urlPattern)
          : urlPattern.test(res.url())
      ),
      action(),
    ]);
    return { request: response.request(), response };
  }
}
