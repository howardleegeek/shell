import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { default as IndexRoute } from './_index';

export async function loader(args: LoaderFunctionArgs) {
  const prompt = args.params.prompt || '';
  return json({ id: args.params.id, prompt });
}

export default IndexRoute;