export function getCuriosityTopicOptions(
  relatedTopics: string[],
  fallbackTopic: string,
  limit = 3
) {
  const seen = new Set<string>();
  const options = [...relatedTopics, fallbackTopic]
    .map((topic) => topic.trim())
    .filter((topic) => {
      if (!topic || seen.has(topic)) {
        return false;
      }

      seen.add(topic);
      return true;
    });

  return options.slice(0, Math.max(1, limit));
}
