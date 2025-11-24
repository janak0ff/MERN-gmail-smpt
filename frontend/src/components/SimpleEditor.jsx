import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, List, ListOrdered } from 'lucide-react';

const SimpleEditor = ({ value, onChange, placeholder }) => {
    const editorRef = useRef(null);
    const isUpdating = useRef(false);

    useEffect(() => {
        if (editorRef.current && !isUpdating.current) {
            const editor = editorRef.current;
            if (editor.innerHTML !== value) {
                editor.innerHTML = value || '';
            }
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            isUpdating.current = true;
            const htmlContent = editorRef.current.innerHTML;
            const textContent = editorRef.current.innerText;
            onChange({ html: htmlContent, text: textContent });
            setTimeout(() => {
                isUpdating.current = false;
            }, 0);
        }
    };

    const execCommand = (command, value = null) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        handleInput();
    };

    const formatButtons = [
        { command: 'bold', icon: Bold, label: 'Bold' },
        { command: 'italic', icon: Italic, label: 'Italic' },
        { command: 'underline', icon: Underline, label: 'Underline' },
        { command: 'insertUnorderedList', icon: List, label: 'Bullet List' },
        { command: 'insertOrderedList', icon: ListOrdered, label: 'Numbered List' }
    ];

    return (
        <div className="simple-editor">
            <div className="editor-toolbar">
                {formatButtons.map(({ command, icon: Icon, label }) => (
                    <button
                        key={command}
                        type="button"
                        className="editor-btn"
                        onClick={() => execCommand(command)}
                        title={label}
                        aria-label={label}
                    >
                        <Icon size={16} />
                    </button>
                ))}
            </div>
            <div
                ref={editorRef}
                className="editor-content"
                contentEditable
                onInput={handleInput}
                data-placeholder={placeholder}
                suppressContentEditableWarning
            />
        </div>
    );
};

export default SimpleEditor;
