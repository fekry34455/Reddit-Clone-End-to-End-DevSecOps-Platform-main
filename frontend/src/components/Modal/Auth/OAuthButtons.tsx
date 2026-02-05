import { Button, Flex, Image, Text } from "@chakra-ui/react";
import React, { useState } from "react";

type OAuthButtonsProps = {};

const OAuthButtons: React.FC<OAuthButtonsProps> = () => {
  const [message, setMessage] = useState("");

  return (
    <Flex direction="column" mb={4} width="100%">
      <Button
        variant="oauth"
        mb={2}
        onClick={() =>
          setMessage("OAuth sign-in is not configured for this backend.")
        }
      >
        <Image src="/images/googlelogo.png" height="20px" mr={4} />
        Continue with Google
      </Button>
      <Button variant="oauth">Some Other Provider</Button>
      {message && (
        <Text textAlign="center" fontSize="10pt" color="red" mt={2}>
          {message}
        </Text>
      )}
    </Flex>
  );
};
export default OAuthButtons;
