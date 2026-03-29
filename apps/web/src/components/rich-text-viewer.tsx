type RichTextBlock = {
  type: "heading" | "paragraph" | "bullet-list" | "numbered-list" | "quote";
  level?: 1 | 2 | 3;
  text?: string;
  items?: string[];
};

export default function RichTextViewer({ blocks }: { blocks: RichTextBlock[] }) {
  return (
    <div className="flex flex-col gap-3">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;

        if (block.type === "heading") {
          if (block.level === 1) {
            return (
              <h2 key={key} className="text-2xl font-medium">
                {block.text}
              </h2>
            );
          }

          return (
            <h3 key={key} className="text-lg font-medium">
              {block.text}
            </h3>
          );
        }

        if (block.type === "bullet-list") {
          return (
            <ul key={key} className="list-disc pl-5 text-sm">
              {block.items?.map((item: string) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        }

        if (block.type === "numbered-list") {
          return (
            <ol key={key} className="list-decimal pl-5 text-sm">
              {block.items?.map((item: string) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          );
        }

        if (block.type === "quote") {
          return (
            <blockquote key={key} className="border-border text-muted-foreground border-l-2 pl-3 italic">
              {block.text}
            </blockquote>
          );
        }

        return (
          <p key={key} className="text-sm leading-6">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
