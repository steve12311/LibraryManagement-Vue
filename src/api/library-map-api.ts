import request from "@/utils/request";

const LIBRARY_MAP_BASE_URL = "/api/v1/library-map";
const PUBLIC_LIBRARY_MAP_BASE_URL = "/api/v1/index/library-map";

const LibraryMapApi = {
  getFloors() {
    return request<unknown, LibraryFloorVO[]>({
      url: `${LIBRARY_MAP_BASE_URL}/floors`,
      method: "get",
    });
  },
  createFloor(data: LibraryFloorForm) {
    return request<LibraryFloorForm, LibraryFloorVO>({
      url: `${LIBRARY_MAP_BASE_URL}/floors`,
      method: "post",
      data,
    });
  },
  updateFloor(id: number, data: LibraryFloorForm) {
    return request<LibraryFloorForm, LibraryFloorVO>({
      url: `${LIBRARY_MAP_BASE_URL}/floors/${id}`,
      method: "put",
      data,
    });
  },
  updateFloorOutline(id: number, outlineJson: string) {
    return request<{ outlineJson: string }, LibraryFloorVO>({
      url: `${LIBRARY_MAP_BASE_URL}/floors/${id}/outline`,
      method: "put",
      data: {outlineJson},
    });
  },
  deleteFloor(id: number) {
    return request<unknown, string>({
      url: `${LIBRARY_MAP_BASE_URL}/floors/${id}`,
      method: "delete",
    });
  },
  getShelves(floorId: number) {
    return request<unknown, BookshelfVO[]>({
      url: `${LIBRARY_MAP_BASE_URL}/floors/${floorId}/shelves`,
      method: "get",
    });
  },
  createShelf(data: BookshelfForm) {
    return request<BookshelfForm, BookshelfVO>({
      url: `${LIBRARY_MAP_BASE_URL}/shelves`,
      method: "post",
      data,
    });
  },
  updateShelf(id: number, data: BookshelfForm) {
    return request<BookshelfForm, BookshelfVO>({
      url: `${LIBRARY_MAP_BASE_URL}/shelves/${id}`,
      method: "put",
      data,
    });
  },
  deleteShelf(id: number) {
    return request<unknown, string>({
      url: `${LIBRARY_MAP_BASE_URL}/shelves/${id}`,
      method: "delete",
    });
  },
  getShelfOptions(enabledOnly = true) {
    return request<unknown, BookshelfOptionVO[]>({
      url: `${LIBRARY_MAP_BASE_URL}/shelves/options`,
      method: "get",
      params: {enabledOnly},
    });
  },
  getPublicFloors() {
    return request<unknown, PublicLibraryFloorVO[]>({
      url: `${PUBLIC_LIBRARY_MAP_BASE_URL}/floors`,
      method: "get",
    });
  },
  getPublicFloorDetail(floorId: number) {
    return request<unknown, PublicLibraryFloorDetailVO>({
      url: `${PUBLIC_LIBRARY_MAP_BASE_URL}/floors/${floorId}`,
      method: "get",
    });
  },
};

export interface MapPoint {
  x: number;
  y: number;
}

export interface LibraryFloorForm {
  id?: number;
  floorNo: number;
  name: string;
  outlineJson?: string;
  sort?: number;
  status: number;
}

export interface LibraryFloorVO extends LibraryFloorForm {
  id: number;
  createTime?: string;
  updateTime?: string;
}

export interface BookshelfForm {
  id?: number;
  floorId: number;
  shelfNo: string;
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  capacity: number;
  status: number;
  remark?: string;
}

export interface BookshelfVO extends BookshelfForm {
  id: number;
  usedStock: number;
  remainingCapacity: number;
  createTime?: string;
  updateTime?: string;
}

export interface BookshelfOptionVO {
  value: number;
  id: number;
  label: string;
  shelfNo: string;
  name?: string;
  floorId: number;
  floorName: string;
  capacity: number;
  usedStock: number;
  remainingCapacity: number;
  status: number;
}

export interface PublicLibraryFloorVO {
  id: number;
  floorNo: number;
  name: string;
  sort: number;
}

export interface PublicShelfBookVO {
  shelfId: number;
  isbn: string;
  coverUrl?: string;
  name: string;
}

export interface PublicBookshelfVO {
  shelfId: number;
  shelfNo: string;
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  capacity: number;
  usedStock: number;
  books: PublicShelfBookVO[];
}

export interface PublicLibraryFloorDetailVO {
  id: number;
  floorNo: number;
  name: string;
  outlineJson?: string;
  shelves: PublicBookshelfVO[];
}

export default LibraryMapApi;
