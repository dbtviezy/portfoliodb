export default function Skills() {
  // Создаем массив твоих профессиональных навыков
  const skills = [
    "Figma",
    "Photoshop",
    "Illustrator",
    "UI/UX Design",
    "Prototyping",
    "Design Systems",
  ];

  return (
    // py-24 — отступы сверху и снизу (визуально отделяем секцию)
    // px-10 md:px-20 — адаптивные отступы по бокам (на мобилках меньше, на ПК больше)
    // border-t border-zinc-900 — тонкая серая линия сверху для разделения блоков
    <section className="py-24 px-10 md:px-20 bg-[#0a0a0a] border-t border-zinc-900">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        
        {/* Левая колонка: Заголовок секции */}
        <div>
          <h2 className="text-sm font-semibold tracking-widest text-zinc-400 uppercase">
            Skills & Tools
          </h2>
        </div>

        {/* Правая колонка: Сетка с нашими навыками (занимает 2 колонки на больших экранах) */}
        <div className="md:col-span-2">
          {/* grid-cols-2 md:grid-cols-3 — 2 колонки на телефонах, 3 на больших экранах */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {skills.map((skill, index) => (
              <div
                key={index}
                // bg-zinc-900/30 — полупрозрачный темный фон
                // border border-zinc-800/50 — очень тонкая серая граница
                // rounded-xl — скругленные углы карточки навыка
                // transition-all duration-300 — плавная анимация при наведении
                // hover:border-zinc-500 — при наведении граница становится светлее
                // hover:bg-zinc-900 — при наведении плашка становится чуть темнее
                className="flex items-center justify-center p-6 bg-zinc-900/30 border border-zinc-800/50 rounded-xl transition-all duration-300 hover:border-zinc-500 hover:bg-zinc-900 group"
              >
                {/* Текст внутри плашки. hover:text-white — делает текст ярче при наведении */}
                <span className="text-zinc-400 text-lg font-medium transition-colors duration-300 group-hover:text-white">
                  {skill}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}