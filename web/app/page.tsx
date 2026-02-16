import { sanityClient } from "../lib/sanity.client";

const homeQuery = `*[_type == "home"][0]{
  title,
  subtitle,
  copyright
}`;

export default async function Home() {
  const data = await sanityClient.fetch<{
    title?: string;
    subtitle?: string;
    copyright?: string;
  }>(homeQuery);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
          <h1 className="text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            {data?.title ?? "OGO S.T.U."}
          </h1>

          <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            {data?.subtitle ?? "Studio für Grafikdesign"}
          </p>

          <p className="text-base text-zinc-600 dark:text-zinc-400">
            {data?.copyright ?? "© 2026"}
          </p>
        </div>
      </main>
    </div>
  );
}
