// router.post("/song", async (req, res) => {
//     const { userId, songId, songName, artistName, albumName, albumCover } = req.body;
//     try {
//       const favorite = await prisma.favoriteSong.upsert({
//         where: {
//           userId_songId: {
//             userId,
//             songId,
//           },
//         },
//         update: {},
//         create: {
//           userId,
//           songId,
//           songName,
//           artistName,
//           albumName,
//           albumCover,
//         },
//       });
//       res.json(favorite);
//     } catch (err) {
//       console.error("Favorite Song Error", err);
//       res.status(500).json({ error: "Failed to save favorite song" });
//     }
//   });
//# sourceMappingURL=favorites.js.map