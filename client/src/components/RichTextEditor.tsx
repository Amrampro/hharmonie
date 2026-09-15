import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Link2,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code2,
  Undo2,
  Redo2,
} from "lucide-react";
import { theme } from "../config/theme";

type Props = {
  value: string; // HTML string
  onChange: (html: string) => void;
  disabled?: boolean;
};

export function RichTextEditor({ value, onChange, disabled }: Props) {
  const editor = useEditor({
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },

        // ✅ important : évite les doublons si ta version les inclut
        link: false as any,
        underline: false as any,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
    ],
    content: value || "<p></p>",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  React.useEffect(() => {
    if (!editor) return;
    // si on charge un post (edit), on sync le contenu
    const current = editor.getHTML();
    if ((value || "") !== current)
      editor.commands.setContent(value || "<p></p>");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  const Btn = ({ active, onClick, children, title }: any) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      onMouseDown={(e) => e.preventDefault()} // ✅ super important
      style={{
        height: 34,
        minWidth: 34,
        padding: "0 10px",
        borderRadius: 10,
        border: `1px solid ${
          active ? theme.colors.primary.main : theme.colors.border.light
        }`,
        backgroundColor: active
          ? theme.colors.primary[100]
          : theme.colors.background.primary,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        cursor: "pointer",
        color: theme.colors.text.primary,
      }}
    >
      {children}
    </button>
  );

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Entrer le lien (https://...)", prev || "");
    if (url === null) return;

    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url.trim() })
      .run();
  };

  return (
    <div
      style={{
        border: `1px solid ${theme.colors.border.light}`,
        borderRadius: 14,
        overflow: "hidden",
        backgroundColor: theme.colors.background.primary,
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          padding: 10,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          borderBottom: `1px solid ${theme.colors.border.light}`,
          backgroundColor: theme.colors.background.secondary,
        }}
      >
        <Btn
          title="Gras"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={16} />
        </Btn>
        <Btn
          title="Italique"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={16} />
        </Btn>
        <Btn
          title="Souligné"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={16} />
        </Btn>
        <Btn
          title="Barré"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={16} />
        </Btn>

        <div
          style={{
            width: 1,
            background: theme.colors.border.light,
            margin: "0 6px",
          }}
        />

        <Btn
          title="Titre H2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 size={16} />
        </Btn>
        <Btn
          title="Titre H3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          <Heading3 size={16} />
        </Btn>

        <div
          style={{
            width: 1,
            background: theme.colors.border.light,
            margin: "0 6px",
          }}
        />

        <Btn
          title="Liste"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={16} />
        </Btn>
        <Btn
          title="Liste numérotée"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={16} />
        </Btn>
        <Btn
          title="Citation"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={16} />
        </Btn>
        <Btn
          title="Code"
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code2 size={16} />
        </Btn>

        <div
          style={{
            width: 1,
            background: theme.colors.border.light,
            margin: "0 6px",
          }}
        />

        <Btn title="Lien" active={editor.isActive("link")} onClick={setLink}>
          <Link2 size={16} />
        </Btn>

        <div style={{ flex: 1 }} />

        <Btn
          title="Annuler"
          active={false}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 size={16} />
        </Btn>
        <Btn
          title="Rétablir"
          active={false}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 size={16} />
        </Btn>
      </div>

      {/* Editor */}
      <div style={{ padding: 14 }}>
        <EditorContent
          editor={editor}
          style={{
            minHeight: 260,
            fontFamily: theme.typography.fontFamily.body,
            fontSize: theme.typography.fontSize.base,
            color: theme.colors.text.primary,
            outline: "none",
          }}
        />
      </div>
    </div>
  );
}
