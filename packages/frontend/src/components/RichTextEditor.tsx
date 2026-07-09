"use client";

import React, { useRef } from "react";
import { Bold, Italic, Heading2, Heading3, List, Link as LinkIcon, Image as ImageIcon } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const insertLink = () => {
    const url = prompt("Digite a URL do link:");
    if (url) {
      execCommand("createLink", url);
    }
  };

  const insertImage = () => {
    const url = prompt("Digite a URL da imagem:");
    if (url) {
      execCommand("insertImage", url);
    }
  };

  // Preenche o editor apenas se ele estiver vazio (para evitar resetar o cursor)
  React.useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600 overflow-x-auto">
        <button
          type="button"
          onClick={() => execCommand("bold")}
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
          title="Negrito"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand("italic")}
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
          title="Itálico"
        >
          <Italic className="w-4 h-4" />
        </button>
        
        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

        <button
          type="button"
          onClick={() => execCommand("formatBlock", "H2")}
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
          title="Título 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand("formatBlock", "H3")}
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
          title="Título 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>
        
        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

        <button
          type="button"
          onClick={() => execCommand("insertUnorderedList")}
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
          title="Lista com Marcadores"
        >
          <List className="w-4 h-4" />
        </button>
        
        <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

        <button
          type="button"
          onClick={insertLink}
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
          title="Inserir Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={insertImage}
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition"
          title="Inserir Imagem (A partir de URL)"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Editable Content Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        className="p-4 min-h-[300px] max-h-[500px] overflow-y-auto outline-none prose dark:prose-invert max-w-none text-gray-900 dark:text-gray-100"
        placeholder={placeholder}
      />
    </div>
  );
}
