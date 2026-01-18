import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Italic, List, ListOrdered, Strikethrough } from 'lucide-react'

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
}

export const RichTextEditor = ({ value, onChange }: RichTextEditorProps) => {
    const editor = useEditor({
        extensions: [StarterKit],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert prose-sm max-w-none focus:outline-none min-h-[80px] p-2 text-foreground'
            }
        }
    })

    if (!editor) {
        return null
    }

    return (
        <div className="border border-input rounded-lg overflow-hidden bg-card transition-colors">
            <div className="flex items-center gap-1 p-1 border-b border-input bg-muted/50">
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    disabled={!editor.can().chain().focus().toggleBold().run()}
                    className={`p-1.5 rounded-md hover:bg-accent transition-colors ${editor.isActive('bold') ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground'}`}
                    title="Bold"
                >
                    <Bold className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    disabled={!editor.can().chain().focus().toggleItalic().run()}
                    className={`p-1.5 rounded-md hover:bg-accent transition-colors ${editor.isActive('italic') ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground'}`}
                    title="Italic"
                >
                    <Italic className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    disabled={!editor.can().chain().focus().toggleStrike().run()}
                    className={`p-1.5 rounded-md hover:bg-accent transition-colors ${editor.isActive('strike') ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground'}`}
                    title="Strikethrough"
                >
                    <Strikethrough className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-border mx-1"></div>
                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-1.5 rounded-md hover:bg-accent transition-colors ${editor.isActive('bulletList') ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground'}`}
                    title="Bullet List"
                >
                    <List className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-1.5 rounded-md hover:bg-accent transition-colors ${editor.isActive('orderedList') ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground'}`}
                    title="Ordered List"
                >
                    <ListOrdered className="w-4 h-4" />
                </button>
            </div>
            <EditorContent editor={editor} className="bg-card" />
        </div>
    )
}
