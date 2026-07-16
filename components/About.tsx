export default function About() {
  return (
    <section className="py-24 px-10 md:px-20 bg-[#0a0a0a] border-t border-zinc-900">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        
        {/* Левая колонка: Маленький заголовок */}
        <div>
          <h2 className="text-sm font-semibold tracking-widest text-zinc-400 uppercase">
            About Me
          </h2>
        </div>

        {/* Правая колонка (занимает 2 части пространства): Твой манифест */}
        <div className="md:col-span-2 max-w-2xl">
          <p className="text-2xl md:text-3xl text-zinc-300 leading-relaxed font-light mb-8">
            I am a digital product designer focused on building functional, polished, and user-centered interfaces. I believe that great design is not just how it looks, but how effortlessly it works.
          </p>
          <p className="text-lg text-zinc-500 leading-relaxed">
            With a sharp eye for detail, grid systems, and typography, I bridge the gap between design and technology. My goal is to help brands and startups stand out by stripping away the noise and focusing on what truly matters to their users.
          </p>
        </div>

      </div>
    </section>
  );
}