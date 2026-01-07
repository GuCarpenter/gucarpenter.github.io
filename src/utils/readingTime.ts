export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const charsPerMinute = 400; // For Chinese

  // Remove HTML tags
  const cleanContent = content.replace(/<[^>]*>/g, '');

  // Check if content is primarily Chinese
  const chineseChars = cleanContent.match(/[\u4e00-\u9fa5]/g) || [];
  const isChinese = chineseChars.length > cleanContent.length * 0.2;

  if (isChinese) {
    const charCount = cleanContent.replace(/\s+/g, '').length;
    return Math.max(1, Math.ceil(charCount / charsPerMinute));
  } else {
    const wordCount = cleanContent.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }
}
