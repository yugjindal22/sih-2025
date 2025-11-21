interface CompareImageItemProps {
  imageUrl: string;
  label: string;
  date?: string;
}

/**
 * Displays a single image item in the compare mode staging area
 */
const CompareImageItem = ({ imageUrl, label, date }: CompareImageItemProps) => {
  return (
    <div className="flex items-center gap-2">
      <img
        src={imageUrl}
        alt={label}
        className="h-16 w-16 object-cover rounded border-2 border-white/30 hover:border-white/50 transition-colors"
      />
      <div className="text-xs">
        <p className="font-medium text-white">{label}</p>
        {date && <p className="text-gray-400">{date}</p>}
      </div>
    </div>
  );
};

export default CompareImageItem;
