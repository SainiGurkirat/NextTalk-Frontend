import Head from 'next/head';

const Layout = ({ children, title = 'NextTalk' }) => {
  return (
    <div className="min-h-screen bg-background text-text">
      <Head>
        <title>{title}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {children}
      </main>
    </div>
  );
};

export default Layout;
