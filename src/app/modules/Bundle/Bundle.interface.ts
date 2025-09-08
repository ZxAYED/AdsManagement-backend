
export interface Bundle {
    id: string;
    adminId: string;
    bundle_name: string;
    screens: Screen[];
    img_url: string;
    price: number;
    duration: string;
    status: BUNDLE_STATUS;
    location: string;
    admin: User;
}


export enum BUNDLE_STATUS {
    ongoing,
    expired
}


// Interface for User (used in the Bundle interface)
export interface User {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
}
