function generateMoviePost(movieInfo, websiteName) {
  if (!movieInfo) {
    return "Sorry, I couldn't find information about that movie.";
  }

  const websiteLink = `https://${websiteName}/${encodeURIComponent(
    movieInfo.title.toLowerCase().replace(/ /g, "-")
  )}`;

  return `
🎬 Movie Details 🎬

Title: ${movieInfo.title}

📝 Description:
${movieInfo.description}

🎭 Categories: ${movieInfo.categories.join(", ")}

🌟 Cast: ${movieInfo.actors.join(", ")}

📅 Year: ${movieInfo.yearOfPublication}
🔞 Age Rating: ${movieInfo.ageRange}
🗣️ Language: ${movieInfo.language}
⏱️ Duration: ${movieInfo.duration}
🎬 Director: ${movieInfo.director || "Not available"}
🌍 Production: ${movieInfo.product}

💡 Original Description:
${movieInfo.originalDescription}

🔗 Watch it on our website:
${websiteLink}
  `.trim();
}

export { generateMoviePost };
