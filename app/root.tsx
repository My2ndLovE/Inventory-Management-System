import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
} from 'react-router';
import type { LinksFunction } from 'react-router';
import stylesheet from '~/styles/globals.css?url';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: stylesheet },
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap',
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">{error.status}</h1>
          <p className="mt-2 text-lg text-gray-600">{error.statusText}</p>
          {error.data && <p className="mt-4 text-sm text-gray-500">{error.data}</p>}
          <a href="/" className="mt-6 inline-block text-blue-600 hover:underline">
            Go back home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Oops!</h1>
        <p className="mt-2 text-lg text-gray-600">Something went wrong</p>
        <p className="mt-4 text-sm text-gray-500">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
        <a href="/" className="mt-6 inline-block text-blue-600 hover:underline">
          Go back home
        </a>
      </div>
    </div>
  );
}
