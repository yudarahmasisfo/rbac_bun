export const listToTree = (list: any[]) => {
  const map: any = {};
  const roots: any[] = [];

  list.forEach((item, index) => {
    map[item.id] = index;
    list[index].children = []; // Inisialisasi tempat sub-menu
  });

  list.forEach((item) => {
    if (item.parentId !== null && map[item.parentId] !== undefined) {
      list[map[item.parentId]].children.push(item);
    } else {
      roots.push(item);
    }
  });

  return roots;
};

