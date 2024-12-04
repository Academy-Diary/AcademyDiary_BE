const updateHeadcount = async (prisma, academy_id) => {
  const academy = await prisma.academy.findUnique({
    where: {
      academy_id,
    },
  });

  if (!academy) {
    throw new Error("학원이 존재하지 않습니다.");
  }

  const student_headcount = await prisma.user.count({
    where: {
      academy_id: academy_id,
      role: "STUDENT",
    },
  });

  const teacher_headcount = await prisma.user.count({
    where: {
      academy_id: academy_id,
      role: "TEACHER",
    },
  });

  // Headcount 업데이트
  await prisma.academy.update({
    where: {
      academy_id,
    },
    data: {
      student_headcount,
      teacher_headcount,
    },
  });

  return { student_headcount, teacher_headcount };
};

module.exports = { updateHeadcount };
