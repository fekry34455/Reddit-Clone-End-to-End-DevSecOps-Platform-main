import React from "react";
import { Flex, Icon, MenuDivider, MenuItem } from "@chakra-ui/react";
import { CgProfile } from "react-icons/cg";
import { MdOutlineLogin } from "react-icons/md";
import { useResetRecoilState } from "recoil";
import { communityState } from "../../../../atoms/communitiesAtom";
import { useAuthContext } from "../../../../context/AuthContext";

type UserListProps = {};

const UserList: React.FC<UserListProps> = () => {
  const resetCommunityState = useResetRecoilState(communityState);
  const { logout } = useAuthContext();

  const handleLogout = () => {
    logout();
    resetCommunityState();
  };

  return (
    <>
      <MenuItem
        fontSize="10pt"
        fontWeight={700}
        _hover={{ bg: "blue.500", color: "white" }}
      >
        <Flex alignItems="center">
          <Icon fontSize={20} mr={2} as={CgProfile} />
          Profile
        </Flex>
      </MenuItem>
      <MenuDivider />
      <MenuItem
        fontSize="10pt"
        fontWeight={700}
        _hover={{ bg: "blue.500", color: "white" }}
        onClick={handleLogout}
      >
        <Flex alignItems="center">
          <Icon fontSize={20} mr={2} as={MdOutlineLogin} />
          Log Out
        </Flex>
      </MenuItem>
    </>
  );
};
export default UserList;
