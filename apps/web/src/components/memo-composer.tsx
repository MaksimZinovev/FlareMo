import type { MemoVisibility } from "@/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n";
import { extractTags } from "@/lib/memo";
import { AtSignIcon, HashIcon, ImageIcon, ListIcon, Loader2Icon, PaperclipIcon, SendIcon, XIcon } from "lucide-react";
import { useState, type ChangeEvent, type Dispatch, type SetStateAction } from "react";

type MemoComposerProps = {
  isPending: boolean;
  onSubmit: (input: { content: string; visibility: MemoVisibility; tags: string[]; files: File[] }) => void;
};

export function MemoComposer({ isPending, onSubmit }: MemoComposerProps) {
  const { t } = useI18n();
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const tags = extractTags(content);
  const canSubmit = content.trim() || files.length > 0;
  const appendText = (value: string) => {
    setContent((current) => `${current}${current && !current.endsWith("\n") ? " " : ""}${value}`);
  };
  const submit = () => {
    if (!canSubmit) {
      return;
    }
    onSubmit({ content, visibility: "private", tags, files });
    setContent("");
    setFiles([]);
  };

  return (
    <section className="group relative flex w-full flex-col rounded-xl border border-border bg-card shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30">
      <Textarea
        aria-label={t("composer.ariaLabel")}
        className="min-h-32 resize-none rounded-t-xl border-0 px-4 pt-4 pb-2 text-[15px] leading-7 shadow-none focus-visible:ring-0"
        disabled={isPending}
        placeholder={t("composer.placeholder")}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            submit();
          }
        }}
      />
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pb-2">
          {files.map((file) => (
            <div
              className="flex max-w-full items-center gap-2 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
              key={`${file.name}-${file.lastModified}`}
            >
              <PaperclipIcon />
              <span className="truncate">{file.name}</span>
              <Button
                aria-label={t("composer.removeFile", { filename: file.name })}
                size="icon-xs"
                type="button"
                variant="ghost"
                onClick={() => setFiles((current) => current.filter((item) => item !== file))}
              >
                <XIcon />
              </Button>
            </div>
          ))}
        </div>
      )}
      <div className="flex h-10 items-center justify-between gap-2 rounded-b-xl bg-card px-3 pb-1">
        <div className="flex min-w-0 items-center gap-1">
          <Button aria-label={t("composer.addTag")} size="icon-sm" type="button" variant="ghost" onClick={() => appendText("#")}>
            <HashIcon />
          </Button>
          <Button asChild size="icon-sm" variant="ghost">
            <label aria-label={t("composer.addAttachment")}>
              <ImageIcon />
              <Input className="hidden" multiple type="file" onChange={(event) => addFiles(event, setFiles)} />
            </label>
          </Button>
          <div className="hidden h-4 w-px bg-border sm:block" />
          <Button aria-label={t("composer.formatText")} size="icon-sm" type="button" variant="ghost">
            <span className="text-sm font-medium">Aa</span>
          </Button>
          <Button aria-label={t("composer.bulletList")} size="icon-sm" type="button" variant="ghost" onClick={() => appendText("- ")}>
            <ListIcon />
          </Button>
          <Button aria-label={t("composer.mention")} size="icon-sm" type="button" variant="ghost" onClick={() => appendText("@")}>
            <AtSignIcon />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button className="size-8 rounded-lg px-0" disabled={isPending || !canSubmit} size="icon-sm" onClick={submit}>
            {isPending ? <Loader2Icon data-icon="inline-start" /> : <SendIcon data-icon="inline-start" />}
            <span className="sr-only">{t("common.save")}</span>
          </Button>
        </div>
      </div>
    </section>
  );
}

function addFiles(event: ChangeEvent<HTMLInputElement>, setFiles: Dispatch<SetStateAction<File[]>>) {
  setFiles(Array.from(event.target.files ?? []));
  event.target.value = "";
}
