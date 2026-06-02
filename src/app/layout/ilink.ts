export interface ILink {
    label: string;
    icon: string;
    role?: string ;
    command: () => string;
}
