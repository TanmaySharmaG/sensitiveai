import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File } from "lucide-react";

const ACCEPTED = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

export default function DropZone({ onFile, file, disabled }) {
  const onDrop = useCallback((accepted) => {
    if (accepted[0]) onFile(accepted[0]);
  }, [onFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxFiles: 1,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
        transition-all duration-300
        ${isDragActive
          ? "border-amber bg-amber/10 scale-[1.01]"
          : file
            ? "border-emerald/50 bg-emerald/5"
            : "border-white/15 hover:border-white/30 hover:bg-white/[0.03]"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <input {...getInputProps()} />
      {file ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald/15 border border-emerald/30 flex items-center justify-center">
            <File size={22} className="text-emerald" />
          </div>
          <div>
            <p className="font-medium text-white text-sm">{file.name}</p>
            <p className="text-white/40 text-xs mt-1">{(file.size / 1024).toFixed(1)} KB — click to change</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-amber/10 border border-amber/20 flex items-center justify-center">
            <UploadCloud size={22} className={isDragActive ? "text-amber animate-bounce" : "text-amber/70"} />
          </div>
          <div>
            <p className="font-medium text-white">
              {isDragActive ? "Drop to upload" : "Drag & drop or click to upload"}
            </p>
            <p className="text-white/40 text-sm mt-1">PDF, DOCX, TXT, JPG, PNG · Max 16 MB</p>
          </div>
        </div>
      )}
    </div>
  );
}
