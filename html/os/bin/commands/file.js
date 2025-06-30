import { currentDirectory } from '../filesystem.js';
import { checkAccess } from '../../superuser.js';

export default async function file(...args) {
  if (args.length === 0) {
    return 'file: missing operand<br>Usage: file [file1] [file2] ...';
  }

  let results = [];

  for (const filename of args) {
    try {
      // Check if file exists
      if (!currentDirectory.children || !currentDirectory.children[filename]) {
        results.push(`${filename}: cannot open \`${filename}' (No such file or directory)`);
        continue;
      }

      const item = currentDirectory.children[filename];

      // Check access permissions
      const accessCheck = checkAccess(item);
      if (!accessCheck.hasAccess) {
        results.push(`${filename}: cannot open \`${filename}' (${accessCheck.message})`);
        continue;
      }

      // Determine file type
      const fileType = determineFileType(filename, item);
      results.push(`${filename}: ${fileType}`);

    } catch (error) {
      results.push(`${filename}: error determining file type - ${error.message}`);
    }
  }

  return results.join('<br>');
}

// Determine file type based on extension and properties
function determineFileType(filename, item) {
  // Handle directories first
  if (item.type === 'directory') {
    return 'directory';
  }

  // Get file extension
  const extension = filename.toLowerCase().split('.').pop();

  // Check file properties for additional hints
  const isExecutable = item.permissions && item.permissions.includes('x');
  const isPlayable = item.playable === true;
  const isViewable = item.viewable === true;
  const hasContent = item.content && item.content.length > 0;
  const fileSize = parseInt(item.size) || 0;

  // Determine type based on extension and properties
  switch (extension) {
    // Text files
    case 'txt':
      return 'ASCII text';
    case 'md':
      return 'Markdown document';
    case 'log':
      return 'ASCII text, with very long lines';
    case 'csv':
      return 'CSV text';
    case 'json':
      return 'JSON data';
    case 'xml':
      return 'XML document';
    case 'html':
    case 'htm':
      return 'HTML document';
    case 'css':
      return 'CSS stylesheet';
    case 'js':
      return 'JavaScript source';
    case 'py':
      return 'Python script';
    case 'sh':
      return 'shell script';
    case 'conf':
    case 'config':
      return 'configuration file';

    // Image files
    case 'jpg':
    case 'jpeg':
      return `JPEG image data, ${fileSize} bytes`;
    case 'png':
      return `PNG image data, ${fileSize} bytes`;
    case 'gif':
      return `GIF image data, ${fileSize} bytes`;
    case 'bmp':
      return `BMP image data, ${fileSize} bytes`;
    case 'svg':
      return 'SVG Scalable Vector Graphics image';
    case 'ico':
      return 'MS Windows icon resource';

    // Audio files
    case 'mp3':
      return `Audio file with ID3 version 2.3.0, ${fileSize} bytes`;
    case 'wav':
      return `RIFF (little-endian) data, WAVE audio, ${fileSize} bytes`;
    case 'flac':
      return `FLAC audio bitstream data, ${fileSize} bytes`;
    case 'ogg':
      return `Ogg data, Vorbis audio, ${fileSize} bytes`;
    case 'm4a':
      return `ISO Media, Apple iTunes AAC-LC, ${fileSize} bytes`;

    // Video files
    case 'mp4':
      return `ISO Media, MP4 Base Media v1, ${fileSize} bytes`;
    case 'avi':
      return `AVI, ${fileSize} bytes`;
    case 'mkv':
      return `Matroska data, ${fileSize} bytes`;
    case 'mov':
      return `QuickTime movie, ${fileSize} bytes`;
    case 'wmv':
      return `Microsoft ASF, ${fileSize} bytes`;

    // Archive files
    case 'zip':
      return `Zip archive data, ${fileSize} bytes`;
    case 'tar':
      return `POSIX tar archive, ${fileSize} bytes`;
    case 'gz':
      return `gzip compressed data, ${fileSize} bytes`;
    case 'bz2':
      return `bzip2 compressed data, ${fileSize} bytes`;
    case 'xz':
      return `XZ compressed data, ${fileSize} bytes`;
    case '7z':
      return `7-zip archive data, ${fileSize} bytes`;
    case 'rar':
      return `RAR archive data, ${fileSize} bytes`;

    // Document files
    case 'pdf':
      return `PDF document, ${fileSize} bytes`;
    case 'doc':
      return `Microsoft Word document, ${fileSize} bytes`;
    case 'docx':
      return `Microsoft Word 2007+ document, ${fileSize} bytes`;
    case 'xls':
      return `Microsoft Excel spreadsheet, ${fileSize} bytes`;
    case 'xlsx':
      return `Microsoft Excel 2007+ spreadsheet, ${fileSize} bytes`;
    case 'ppt':
      return `Microsoft PowerPoint presentation, ${fileSize} bytes`;
    case 'pptx':
      return `Microsoft PowerPoint 2007+ presentation, ${fileSize} bytes`;

    // Programming files
    case 'c':
      return 'C source';
    case 'cpp':
    case 'cxx':
      return 'C++ source';
    case 'h':
      return 'C header';
    case 'java':
      return 'Java source';
    case 'class':
      return 'Java class file';
    case 'php':
      return 'PHP script';
    case 'rb':
      return 'Ruby script';
    case 'go':
      return 'Go source';
    case 'rs':
      return 'Rust source';

    // Binary/executable files
    case 'exe':
      return 'PE32 executable (MS Windows)';
    case 'dll':
      return 'PE32 dynamic link library (MS Windows)';
    case 'so':
      return 'ELF shared object';
    case 'deb':
      return 'Debian binary package';
    case 'rpm':
      return 'RPM package';

    default:
      // Fallback analysis based on content and properties
      if (isExecutable) {
        return 'executable file';
      }

      if (isPlayable && !isViewable) {
        return `multimedia file, ${fileSize} bytes`;
      }

      if (isViewable && !isPlayable) {
        return `image data, ${fileSize} bytes`;
      }

      if (hasContent) {
        // Try to analyze content
        const content = item.content || '';

        // Check for HTML
        if (content.includes('<html>') || content.includes('<!DOCTYPE')) {
          return 'HTML document';
        }

        // Check for XML
        if (content.includes('<?xml')) {
          return 'XML document';
        }

        // Check for JSON
        if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
          return 'JSON data';
        }

        // Check for script shebang
        if (content.startsWith('#!')) {
          return 'script text executable';
        }

        // Check if it looks like text
        const textChars = content.replace(/[^\x20-\x7E\t\n\r]/g, '');
        if (textChars.length / content.length > 0.95) {
          return fileSize > 1000 ? 'ASCII text, with very long lines' : 'ASCII text';
        }

        return `data, ${fileSize} bytes`;
      }

      if (fileSize === 0) {
        return 'empty';
      }

      return `data, ${fileSize} bytes`;
  }
}

file.help = "Determine file type. Usage: file [file1] [file2] ...";