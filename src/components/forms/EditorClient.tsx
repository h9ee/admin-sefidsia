// src/components/Editor.tsx
'use client';

import { memo, useMemo, useState } from 'react';
// (اختیاری) اگر در بعضی محیط‌ها با SSR مشکل داری، می‌تونی CKEditor را داینامیک ایمپورت کنی
import 'ckeditor5/ckeditor5.css';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  Alignment, AutoLink, BlockQuote, Bold, ClassicEditor, Code, CodeBlock, Essentials,
  FindAndReplace, FontBackgroundColor, FontColor, FontFamily, FontSize, Fullscreen, Heading,
  HeadingButtonsUI, Highlight, HorizontalLine, HtmlEmbed, Image, ImageCaption, ImageInsert,
  ImageResize, ImageStyle, ImageToolbar, ImageUpload, Indent, IndentBlock, Italic, Link, LinkImage, List,
  ListProperties, MediaEmbed, PageBreak, Paragraph, ParagraphButtonUI, RemoveFormat, SelectAll,
  SourceEditing, SpecialCharacters, SpecialCharactersEssentials,
  Strikethrough, Subscript, Superscript, Table, TableCellProperties, TableProperties,
  TableToolbar, TodoList, Underline
} from 'ckeditor5';
import type { Editor as CKEditorInstance, EventInfo } from 'ckeditor5';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

import { BarChart2 } from 'lucide-react';
import { showToast } from './toast/showToast';
import { mediaService } from '@/services/media.service';
import { mediaUrl } from '@/lib/media-url';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Custom CKEditor 5 upload adapter that pushes files through the project's
 * `/media` endpoint (via `mediaService.upload`) instead of CKEditor's built-in
 * `SimpleUploadAdapter`. This gives us:
 *   - The correct API base URL (from `NEXT_PUBLIC_API_URL`).
 *   - Auth (axios attaches the access token from localStorage).
 *   - Progress reporting and abort.
 *   - The new `NEXT_PUBLIC_API_URL_IMAGE` prefix on the returned URL.
 */
class SefidsiaUploadAdapter {
  private loader: any;
  private controller: AbortController;

  constructor(loader: any) {
    this.loader = loader;
    this.controller = new AbortController();
  }

  async upload(): Promise<{ default: string }> {
    const file: File = await this.loader.file;
    if (!file) throw new Error('فایلی برای آپلود انتخاب نشده است');
    const item = await mediaService.upload({
      file,
      folder: 'articles',
      onProgress: (p) => {
        this.loader.uploadTotal = file.size;
        this.loader.uploaded = Math.round(p * file.size);
      },
      signal: this.controller.signal,
    });
    return { default: mediaUrl(item.url) };
  }

  abort(): void {
    this.controller.abort();
  }
}

function SefidsiaUploadAdapterPlugin(editor: CKEditorInstance): void {
  (editor.plugins.get('FileRepository') as any).createUploadAdapter = (loader: any) =>
    new SefidsiaUploadAdapter(loader);
}

const RichTextEditorComponent = memo((
  {
    value,
    onChange,
    placeholder,
    useProse = false
  }: { value: string; onChange: (data: string) => void; placeholder?: string; useProse?: boolean }
) => {
  const editorConfig = useMemo(() => ({
    licenseKey: 'GPL',
    language: { ui: 'fa', content: 'fa' },
    placeholder: placeholder ?? '',
    plugins: [
      Essentials, Paragraph, Heading, HeadingButtonsUI, ParagraphButtonUI,
      Bold, Italic, Underline, Strikethrough, Code, CodeBlock,
      FontColor, FontBackgroundColor, FontFamily, FontSize,
      Highlight, RemoveFormat, Subscript, Superscript,
      Link, AutoLink, LinkImage,
      List, TodoList, ListProperties,
      Indent, IndentBlock, BlockQuote, Alignment,
      SpecialCharacters, SpecialCharactersEssentials,
      HorizontalLine, PageBreak,
      FindAndReplace, SelectAll,
      Table, TableToolbar, TableProperties, TableCellProperties,
      Image, ImageToolbar, ImageStyle, ImageCaption,
      ImageInsert, ImageResize, ImageUpload,
      MediaEmbed, HtmlEmbed, SourceEditing, Fullscreen,
    ],
    // Register our custom upload adapter (pushes files through `/media` via
    // `mediaService.upload` — replaces the broken SimpleUploadAdapter setup).
    extraPlugins: [SefidsiaUploadAdapterPlugin],
    toolbar: {
      items: [
        'undo', 'redo', '|',
        'heading', '|',
        'bold', 'italic', 'underline', 'strikethrough', '|',
        'fontColor', 'fontBackgroundColor', 'highlight', '|',
        'link', 'bulletedList', 'numberedList', 'todoList', '|',
        'insertImage', 'uploadImage', '|',
        'outdent', 'indent', 'alignment', '|',
        'blockQuote', 'insertTable', 'mediaEmbed', 'htmlEmbed', '|',
        'code', 'codeBlock', 'sourceEditing', '|',
        'removeFormat', 'fullscreen'
      ],
      shouldNotGroupWhenFull: true
    },
    heading: {
      options: [
        { model: 'paragraph' as const, title: 'پاراگراف', class: 'ck-heading_paragraph' },
        { model: 'heading1' as const, view: 'h1', title: 'سرفصل ۱', class: 'ck-heading_heading1' },
        { model: 'heading2' as const, view: 'h2', title: 'سرفصل ۲', class: 'ck-heading_heading2' },
        { model: 'heading3' as const, view: 'h3', title: 'سرفصل ۳', class: 'ck-heading_heading3' },
      ]
    },
    image: {
      toolbar: ['imageTextAlternative', '|', 'imageStyle:alignLeft', 'imageStyle:alignCenter', 'imageStyle:alignRight', '|', 'linkImage']
    },
    table: {
      contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties']
    },
    ui: { viewportOffset: { top: 64 } }
  }), [placeholder]);

  const handleReady = (editor: CKEditorInstance) => {
    // نمایش هشدارهای CKEditor با Toast
    const notificationPlugin = editor.plugins.get('Notification');

    notificationPlugin?.on('show:warning', (_event: EventInfo, data: { message?: unknown }) => {
      if (typeof data?.message === 'string') {
        showToast(data.message, 'error');
      }
    });
  };

  // ⚠️ نکته: کلاس prose روی CKEditor معمولاً تداخل ایجاد می‌کنه. پیش‌فرض خاموشه.
  const wrapClass = useProse ? 'prose prose-sm sm:prose-base lg:prose-lg max-w-none w-full' : 'w-full';

  return (
    <div className={wrapClass}>
      <CKEditor
        editor={ClassicEditor}
        data={value ?? ''}                 // ← تضمین رشتهٔ خالی
        config={editorConfig}
        onReady={handleReady}
        onChange={(_event: EventInfo, editor: CKEditorInstance) => onChange(editor.getData())}
      />
    </div>
  );
});
RichTextEditorComponent.displayName = 'RichTextEditorComponent';

/* -------------------------------------------------------------------------- */
/* Main Editor Component */
/* -------------------------------------------------------------------------- */

interface EditorProps {
  value: string;
  onChange: (data: string) => void;
  // ✅ تغییر: title اختیاری شد
  title?: string;
  analyze?: boolean;
  // ✅ تغییر: پشتیبانی از placeholder و className
  placeholder?: string;
  className?: string;
  // ✅ اگر بخوای عمداً prose فعال بشه
  useProse?: boolean;
}

interface AnalysisResults {
  wordCount: number;
  charCount: number;
  sentenceCount: number;
  readingTime: number;
  topWords: { name: string; count: number }[];
  keywordInfo: { name: string; count: number; density: string } | null;
}

export default function Editor({
  value,
  onChange,
  title,
  analyze = false,
  placeholder,
  className,
  useProse = false
}: EditorProps) {
  const [keyword, setKeyword] = useState("");
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);

  const stopWords = [
    "که","از","برای","این","و","به","در","با","آن","ی","را","می","ها","یا","بر","اگر","های","نیز","تا","یک","شود","شد","است",
  ];

  const analyzeContent = () => {
    const plainText = (value || '').replace(/(<([^>]+)>)/gi, "").trim();
    if (!plainText) return showToast("برای آنالیز، ابتدا متنی را وارد کنید.", "error");

    const words = plainText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const charCount = plainText.length;
    const sentenceCount = plainText.split(/[.!?؟]+/).filter(Boolean).length;
    const readingTime = Math.ceil(wordCount / 225);

    const wordFrequencies: { [key: string]: number } = {};
    words.forEach(word => {
      const cleanWord = word.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");
      if(cleanWord && !stopWords.includes(cleanWord)) {
        wordFrequencies[cleanWord] = (wordFrequencies[cleanWord] || 0) + 1;
      }
    });

    const sortedWords = Object.entries(wordFrequencies)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([name, count]) => ({ name, count }));

    let keywordInfo = null;
    if (keyword.trim()) {
      const keywordCount = words.filter(w => w.toLowerCase() === keyword.trim().toLowerCase()).length;
      const density = wordCount > 0 ? ((keywordCount / wordCount) * 100).toFixed(2) : "0.00";
      keywordInfo = { name: keyword.trim(), count: keywordCount, density: `${density}%` };
    }

    setAnalysisResults({ wordCount, charCount, sentenceCount, readingTime, topWords: sortedWords, keywordInfo });
  };

  const getBadgeVariant = (word: string) => {
    if (analysisResults?.keywordInfo?.name.toLowerCase() === word.toLowerCase()) return "default";
    return "secondary";
  };

  return (
    <div className={className}>
      {/* title اختیاری */}
      {title ? <Label className="text-xl font-semibold mb-2 inline-block">{title}</Label> : null}

      <RichTextEditorComponent
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        useProse={useProse}
      />

      {analyze && (
        <div className="space-y-4 pt-4 border-t">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Input
              placeholder="کلمه کلیدی اصلی را وارد کنید..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="flex-grow"
            />
            <Button onClick={analyzeContent} className="w-full sm:w-auto">
              <BarChart2 className="ml-2 h-4 w-4" />
              آنالیز محتوا
            </Button>
          </div>

          {analysisResults && (
            <Card>
              <CardHeader><CardTitle>نتایج آنالیز محتوا</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">تعداد کلمات</div>
                    <div className="text-2xl font-bold">{analysisResults.wordCount}</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">زمان مطالعه</div>
                    <div className="text-2xl font-bold">≈ {analysisResults.readingTime} دقیقه</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">تعداد جملات</div>
                    <div className="text-2xl font-bold">{analysisResults.sentenceCount}</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">تعداد کاراکترها</div>
                    <div className="text-2xl font-bold">{analysisResults.charCount}</div>
                  </div>
                </div>

                {analysisResults.keywordInfo && (
                  <div className="flex justify-between items-center p-3 bg-primary/10 text-primary-foreground rounded-lg">
                    <div className="font-semibold">
                      کلمه کلیدی: <span className="font-bold text-primary">{analysisResults.keywordInfo.name}</span>
                    </div>
                    <div className="text-right">
                      <div>تکرار: <span className="font-bold">{analysisResults.keywordInfo.count}</span> بار</div>
                      <div>چگالی: <span className="font-bold">{analysisResults.keywordInfo.density}</span></div>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-3">۱۵ کلمه پرکاربرد (بدون کلمات ایست)</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysisResults.topWords.length > 0
                      ? analysisResults.topWords.map((word, index) => (
                          <Badge key={index} variant={getBadgeVariant(word.name)} className="text-sm">
                            {word.name}
                            <span className="mr-2 bg-background/50 text-foreground h-5 w-5 flex items-center justify-center rounded-full text-xs">
                              {word.count}
                            </span>
                          </Badge>
                        ))
                      : <p className="text-sm text-muted-foreground">کلمه‌ای یافت نشد.</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
