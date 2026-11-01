import Link from 'next/link';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

interface SeoProductLandingProps {
  path: string;
  title: string;
  description: string;
  intro: string;
  benefits: Array<{ title: string; description: string }>;
  steps: string[];
  faqs: Array<{ question: string; answer: string }>;
  relatedHref: string;
  relatedLabel: string;
}

export default function SeoProductLanding({
  path,
  title,
  description,
  intro,
  benefits,
  steps,
  faqs,
  relatedHref,
  relatedLabel,
}: SeoProductLandingProps) {
  const siteUrl = 'https://bgern.com';
  const pageUrl = `${siteUrl}${path}`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url: pageUrl,
    inLanguage: 'en',
    isPartOf: {
      '@type': 'WebSite',
      name: 'Bgern',
      url: siteUrl,
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F5F6] text-neutral-900 dark:bg-[#0B0F17] dark:text-neutral-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
        }}
      />
      <Navbar />
      <main className="flex-1">
        <section className="px-4 py-16 sm:py-24 bg-white dark:bg-[#131924]">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <p className="text-sm font-bold uppercase tracking-widest text-[#0062FF]">
              Bgern Creator Tools
            </p>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#632450] dark:text-white">
              {title}
            </h1>
            <p className="max-w-3xl mx-auto text-base sm:text-lg leading-relaxed text-neutral-600 dark:text-neutral-300">
              {intro}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
              <Link
                href="/studio"
                className="px-6 py-3 rounded-xl bg-[#0062FF] hover:bg-[#0052d9] text-white font-bold text-sm text-center"
              >
                Open Bgern Studio
              </Link>
              <Link
                href={relatedHref}
                className="px-6 py-3 rounded-xl border border-[#256E96]/30 bg-white dark:bg-[#0B0F17] font-bold text-sm text-center"
              >
                {relatedLabel}
              </Link>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-14 sm:py-20 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {benefits.map((benefit) => (
              <article
                key={benefit.title}
                className="p-6 rounded-2xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35"
              >
                <h2 className="text-lg font-black text-[#632450] dark:text-white">
                  {benefit.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                  {benefit.description}
                </p>
              </article>
            ))}
          </div>

          <section className="p-6 sm:p-9 rounded-3xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35">
            <h2 className="text-2xl font-black text-[#632450] dark:text-white">
              How to use this tool
            </h2>
            <ol className="mt-6 space-y-4">
              {steps.map((step, index) => (
                <li key={step} className="flex items-start gap-3 text-sm leading-relaxed">
                  <span className="w-7 h-7 shrink-0 rounded-full bg-[#0062FF]/10 text-[#0062FF] font-black flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="pt-1 text-neutral-700 dark:text-neutral-300">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-black text-[#632450] dark:text-white">
              Frequently asked questions
            </h2>
            <div className="mt-5 space-y-3">
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group p-5 rounded-2xl bg-white dark:bg-[#131924] border border-[#256E96]/20 dark:border-[#256E96]/35"
                >
                  <summary className="cursor-pointer font-bold text-neutral-900 dark:text-white">
                    {faq.question}
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>

          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Explore more creator resources in the <Link className="text-[#0062FF] underline" href="/blog">Bgern Blog &amp; Guides</Link>, or compare plans on the <Link className="text-[#0062FF] underline" href="/pricing">pricing page</Link>.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
