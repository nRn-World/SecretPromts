import React from 'react';
import { usePrompts } from '../context/PromptContext';
import { useLanguage } from '../context/LanguageContext';

export const Marquee: React.FC = () => {
  const { prompts, setSelectedPromptForDetail } = usePrompts();
  const { promptTitle } = useLanguage();

  // If we don't have enough images, we can duplicate the array a few times to ensure smooth infinite marquee
  const validPrompts = prompts.filter(p => p.imageUrl);

  if (validPrompts.length === 0) return null;

  // Duplicate to make sure the ticker is fully filled for ultra-widescreens
  const tickerItems = [...validPrompts, ...validPrompts, ...validPrompts, ...validPrompts];

  return (
    <div className="relative w-full overflow-hidden bg-zinc-950 py-4 border-b border-zinc-800/40">
      
      {/* Ticker Container */}
      <div className="animate-marquee flex gap-4">
        {tickerItems.map((prompt, index) => {
          const title = promptTitle(prompt.id, prompt.title, prompt.isCustom);

          return (
            <div
              key={`${prompt.id}-${index}`}
              onClick={() => setSelectedPromptForDetail(prompt)}
              className="relative flex-shrink-0 w-32 h-32 sm:w-40 sm:h-40 rounded-xl overflow-hidden cursor-pointer group bg-zinc-950 border border-zinc-800/40 transition-transform duration-300 hover:scale-105 hover:z-10"
              title={title}
            >
              <img
                src={prompt.imageUrl}
                alt={title}
                className="w-full h-full object-contain bg-zinc-950 transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              
              {/* Subtle glow/shadow overlay on hover */}
              <div className="absolute inset-0 bg-zinc-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                <span className="text-[10px] font-bold text-white truncate w-full drop-shadow">
                  {title}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fade edges */}
      <div className="absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r from-zinc-950 to-transparent pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-zinc-950 to-transparent pointer-events-none" />

    </div>
  );
};
