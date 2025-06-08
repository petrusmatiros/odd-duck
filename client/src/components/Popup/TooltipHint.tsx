import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface Props {
  tooltipText: string;
  children: React.ReactNode;
}


export default function TooltipHint({
  tooltipText,
  children,
}: Props) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );
}