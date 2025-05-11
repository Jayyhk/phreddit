export const formatTimeDelta = (date) => {
  const now = new Date();
  const ms = now - new Date(date);
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const hrs = Math.floor(min / 60);
  const days = Math.floor(hrs / 24);

  if (days === 0) {
    if (hrs > 0) return `${hrs} hour(s) ago`;
    if (min > 0) return `${min} minute(s) ago`;
    return `${sec} second(s) ago`;
  }
  if (days < 30) return `${days} day(s) ago`;
  const months = Math.floor(days / 30);
  if (days < 365) return `${months} month(s) ago`;
  const years = Math.floor(days / 365);
  return `${years} year(s) ago`;
};

export const parseHyperlinks = (text) => {
  const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  return text.replace(regex, (match, linkText, url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
  });
};

export const validateHyperlinks = (text) => {
  const regex = /\[([^\]]*)\]\(([^)]*)\)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const linkText = match[1];
    const url = match[2];
    if (linkText.trim() === "") {
      return "Hyperlink text cannot be empty.";
    }
    if (
      url.trim() === "" ||
      (!url.startsWith("http://") && !url.startsWith("https://"))
    ) {
      return "Hyperlink URL cannot be empty and must start with 'http://' or 'https://'.";
    }
  }
  return "";
};
