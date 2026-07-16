export default function Projects() {
  const projects = [
    {
      title: "Nova Smart Home",
      category: "Mobile App • IoT System",
      year: "2025",
      description: "A minimalist mobile application designed to control and monitor smart home devices with seamless interactive widgets.",
      image: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1200&q=80",
      link: "#"
    },
    {
      title: "Linear Analytics",
      category: "Web Platform • Dashboard",
      year: "2026",
      description: "High-performance real-time analytics dashboard with custom-built dark mode visual aesthetics and interactive data charts.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
      link: "#"
    }
  ];

  return (
    <section className="py-20 px-10 md:px-20 bg-[#0a0a0a]">
      {/* Маленький аккуратный заголовок секции */}
      <div className="flex justify-between items-baseline border-b border-zinc-800 pb-6 mb-12">
        <h2 className="text-sm font-semibold tracking-widest text-zinc-400 uppercase">
          Selected Projects
        </h2>
        <span className="text-xs text-zinc-500">
          Showing {projects.length} of {projects.length}
        </span>
      </div>

      {/* Сетка с карточками проектов */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {projects.map((project, index) => (
          <a 
            href={project.link} 
            key={index}
            className="group block cursor-pointer"
          >
            {/* Обертка для картинки с эффектом приближения при наведении */}
            <div className="overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800/50 aspect-[16/10] mb-6">
              <img 
                src={project.image} 
                alt={project.title}
                className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out"
              />
            </div>

            {/* Текстовый блок под картинкой */}
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-2xl font-semibold text-white tracking-tight group-hover:text-zinc-300 transition-colors">
                {project.title}
              </h3>
              <span className="text-sm text-zinc-500 font-mono">
                {project.year}
              </span>
            </div>

            <p className="text-sm text-zinc-400 mb-2">
              {project.category}
            </p>
            
            <p className="text-sm text-zinc-500 leading-relaxed max-w-md">
              {project.description}
            </p>
          </a>
        ))}
      </div>
    </section>
  );
}