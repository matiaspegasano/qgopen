interface TitleBarProps {
  title: string;
  meta?: string;
}

export default function TitleBar({ title, meta }: TitleBarProps) {
  return (
    <div className="title-bar">
      <div className="title-bar-text">
        <div className="title-bar-title">{title}</div>
        {meta && <div className="title-bar-meta">{meta}</div>}
      </div>
    </div>
  );
}
