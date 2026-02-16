'use client'

import { Editor, EditorProvider, Toolbar, BtnBold, BtnItalic, BtnBulletList, BtnNumberedList, BtnLink, BtnClearFormatting, BtnRedo, BtnUndo } from 'react-simple-wysiwyg'

type Props = {
    value: string
    onChange: (value: string) => void
    minHeight?: string
}

export function RichTextEditor({ value, onChange, minHeight = '200px' }: Props) {
    return (
        <div className="rounded border border-zinc-700 bg-white/5 overflow-hidden">
            <EditorProvider>
                <Editor
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="text-zinc-100 bg-zinc-800"
                    style={{ minHeight }}
                >
                    <Toolbar>
                        <BtnUndo />
                        <BtnRedo />
                        <div className="w-px h-4 bg-zinc-700 mx-1" />
                        <BtnBold />
                        <BtnItalic />
                        <div className="w-px h-4 bg-zinc-700 mx-1" />
                        <BtnBulletList />
                        <BtnNumberedList />
                        <div className="w-px h-4 bg-zinc-700 mx-1" />
                        <BtnLink />
                        <BtnClearFormatting />
                    </Toolbar>
                </Editor>
            </EditorProvider>
            <style jsx global>{`
        .rsw-ce {
          background-color: transparent !important;
          color: white !important;
          padding: 12px !important;
          font-size: 14px !important;
          min-height: ${minHeight} !important;
        }
        .rsw-toolbar {
          background-color: #18181b !important;
          border-bottom: 1px solid #3f3f46 !important;
          display: flex;
          flex-wrap: wrap;
          gap: 2px;
          padding: 4px !important;
        }
        .rsw-btn {
          color: #a1a1aa !important;
          background: transparent !important;
          border-radius: 4px !important;
        }
        .rsw-btn:hover {
          background: #27272a !important;
          color: white !important;
        }
        .rsw-btn[data-active="true"] {
          background: #3f3f46 !important;
          color: #fbbf24 !important;
        }
      `}</style>
        </div>
    )
}
